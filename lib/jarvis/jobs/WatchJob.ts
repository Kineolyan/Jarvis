import { Observable, Subject } from 'rxjs';
import { EventEmitter } from 'events';
import * as chokidar from 'chokidar';
import * as _ from 'lodash';

import ExecJob, {ExecDefinition} from './ExecJob';
import Job from './Job';
import Logger from '../interface/Logger';
import {ProcessMsg, isOutput, isCompletion} from '../system/Process';

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

class WatchExecutor {
	private _runningJob: boolean;
	private _pendingExecution: boolean;
	private _subject: Subject<ProcessMsg>;

	constructor(private _job: Job) {
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
							this._subject.next({
								data: `[watch] completed with ${msg.code === 0 ? 'success' : 'failure'}`,
								source: 'out'
							});
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
			}
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
					const runner = this._runner = new WatchExecutor(job);
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