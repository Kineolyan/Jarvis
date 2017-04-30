import { Observable, Subject } from 'rxjs';
import { EventEmitter } from 'events';
import * as chokidar from 'chokidar';
import * as _ from 'lodash';

import ExecJob, {ExecDefinition} from './ExecJob';
import Job from './Job';
import Logger from '../interface/Logger';
import Dialog from '../interface/Dialog';
import {ProcessMsg, isOutput, isCompletion} from '../system/Process';

interface CmdWatchDefinition {
	files: string,
	cmd: ExecDefinition
}
interface JobWatchDefinition {
	files: string,
	job: string
}
type WatchDefinition = CmdWatchDefinition | JobWatchDefinition;
function isCommand(definition: WatchDefinition): definition is CmdWatchDefinition {
	return 'cmd' in definition;
}
function isJob(definition: WatchDefinition): definition is JobWatchDefinition {
	return 'job' in definition;
}

class WatchExecutor {
	private _runningJob: boolean;
	private _pendingExecution: boolean;
	private _subject: Subject<ProcessMsg>;

	constructor(private _job: Job, private _dialog: Dialog) {
		this._subject = new Subject();
	}

	get subject() {
		return this._subject;
	}

	run(): void {
		if (!this._runningJob) {
			this._runningJob = true;
			this._job.execute()
				.subscribe({
					next: (msg) => {
						if (isOutput(msg)) {
							this._subject.next({
								data: `[watch] ${msg.data}`,
								source: msg.source
							});
						} else if (isCompletion(msg)) {
							const isSuccess = msg.code === 0;
							const message = `[watch] completed with ${isSuccess ? 'success' : 'failure'}`;
							// Send it with logs to keep track of the end
							this._subject.next({
								data: message,
								source: 'out'
							});
							// Print it for user in console
							this._dialog.say(message);
						}
					},
					error: (err) => this.endRun(),
					complete: () => this.endRun()
				})
		} else {
			this._pendingExecution = true;
		}
	}

	private endRun() {
		this._runningJob = false;

		if (this._pendingExecution) {
			this._pendingExecution = false;
			this.run();
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
class WatchJob implements Job {
	private _watcher: any; // FIXME should be FSWatcher
	private _runner?: WatchExecutor;
	private _debounceTime: number;

  constructor(
			private _def: WatchDefinition,
			options: {
				debounceTime?: number
			},
			private _dialog: Dialog
		) {
		this._debounceTime = options.debounceTime || 250;
	}

	execute() {
		if (this._watcher) {
			throw new Error('Already started');
		}

		return Observable.fromPromise(this.createAction())
			.flatMap(job => {
				if (this._runner === undefined) {
					const runner = new WatchExecutor(job, this._dialog);
					this._runner = runner;
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

					return runner.subject;
				} else {
					return this._runner.subject;
				}
			});
	}

	stop() {
		if (this._watcher) {
			this._watcher.close();
			return true;
		}	else {
			return false;
		}
	}

	private createAction(): Promise<ExecJob> {
		if (isCommand(this._def)) {
			return Promise.resolve(new ExecJob(this._def.cmd));
		} else if (isJob(this._def)) {
			return ExecJob.create(this._def.job);
		} else {
			return Promise.reject(new Error(`Unknown type of definition ${JSON.stringify(this._def)}`));
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