import { EventEmitter } from 'events';
import * as chokidar from 'chokidar';
import * as _ from 'lodash';

import ExecJob, {ExecDefinition} from './ExecJob';
import Job from './Job';
import Logger from '../interface/Logger';

interface CmdWatchDefinition {
	kind: 'cmd';
	files: string,
	cmd: ExecDefinition
}
interface JobWatchDefinition {
	kind: 'job'
	files: string,
	job: string
}
type WatchDefinition = CmdWatchDefinition | JobWatchDefinition;
type SystemJob = Job<string>;

class WatchExecutor {
	private _runningJob: boolean;
	private _pendingExecution: boolean;

	constructor(private _job: SystemJob, private _logger: Logger) {}

	run(): void {
		if (!this._runningJob) {
			this._runningJob = true;
			this._job.execute()
				.catch(output => {
					/* No handling so far, just turning into a success */
					this._logger.log('[watch]', output);
				})
				.then(output => {
					this._logger.log('[watch]', output);
					this._runningJob = false;

					if (this._pendingExecution) {
						this._pendingExecution = false;
						this.run();
					}
				});
		} else {
			this._pendingExecution = true;
		}
	}
}

const LISTEN_EVENTS = [
	'add',
  'change',
  'unlink',
  'addDir',
  'unlinkDir'
];
class WatchJob implements Job<any> {
	private _watcher: any; // FIXME should be FSWatcher
	private _resolver: ((result?: {} | PromiseLike<{}>) => void) | null;
	private _logger: Logger;
	private _debounceTime: number;

  constructor(
			private _def: WatchDefinition,
			options: {
				logger: Logger,
				debounceTime?: number
			}
		) {
		this._logger = options.logger;
		this._debounceTime = options.debounceTime || 250;
	}

	execute(): Promise<any> {
		if (this._watcher) {
			throw new Error('Already started');
		}

		return new Promise((resolve, reject) => {
			this._resolver = resolve;

			this.createAction()
				.then(job => {
					const runner = new WatchExecutor(job, this._logger);
					// FIXME how to stop the runner
					const cbk = _.debounce(path => runner.run(), this._debounceTime);
					this._watcher = chokidar.watch(this._def.files, {
						// ignored: /../,
						// persistent: true
					});
					this._watcher.on('error', err => {
						console.error('Error during watch', err);
					});
					this._watcher.on('ready', () => {
						LISTEN_EVENTS.forEach(eventName => this._watcher.on(eventName, cbk));
					});

					// this._watcher.on('all', (...args) => console.log('chokidar', args));
				})
				.catch(err => {
					this._resolver = null;
					this._watcher = null;
					reject(err);
				});
		});
	}

	stop(): boolean {
		if (this._resolver) {
			if (this._watcher) {
				this._watcher.close();
			}
			this._resolver();

			this._resolver = null;
			this._watcher = null;
			return true;
		}	else {
			throw new Error(`Never started`);
		}
	}

	private createAction(): Promise<ExecJob> {
		switch (this._def.kind) {
			case 'cmd': return Promise.resolve(new ExecJob(this._def.cmd));
			case 'job': return ExecJob.create(this._def.job);
		}
	}
}

export default WatchJob;
export {
	CmdWatchDefinition,
	JobWatchDefinition,
	WatchDefinition,
	WatchExecutor
};