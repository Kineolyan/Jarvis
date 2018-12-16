import {spawn, ChildProcess} from 'child_process';
import * as fs from 'fs';
import { Observable, Subject, of } from 'rxjs';

interface ProcessOptions {
	cwd?: string
};

interface ProcessOutput {
	data: string,
	source: 'out' | 'err'
};
interface ProcessCompletion {
	code: number
};
type ProcessMsg = ProcessOutput | ProcessCompletion;
function isOutput(msg: ProcessMsg): msg is ProcessOutput {
	return (<ProcessOutput>msg).data !== undefined;
}
function isCompletion(msg: ProcessMsg): msg is ProcessCompletion {
	return (<ProcessCompletion>msg).code !== undefined;
}

interface Process extends Observable<ProcessMsg> {}

/**
 * Safely spawn a process, checking its cwd
 */
function spawnProcess(cmd, args, opts): Promise<ChildProcess> {
	return new Promise((resolve, reject) => {
			const cwd = opts.cwd || process.cwd();
			// Check that the cwd exist, otherwise spawn fails
			fs.stat(cwd, err => {
				err
					? reject(new Error(`Process cwd ${cwd} does not exist`))
					: resolve();
			});
		})
		.then(() => spawn(cmd, args, opts));
}

function execute(cmd: string, args: string[], options: ProcessOptions): Observable<ProcessMsg> {
	const processObs = Observable.create(function subscribe(observer) {
		const forwardData: (string) => ((string) => void) =
			source => data => {
			const msg: ProcessOutput = {
				data,
				source
			};
			observer.next(msg);
		};

		const opts = {...options, shell: true};
		const process_ = spawnProcess(cmd, args, opts);
		process_
			.catch(err => observer.error(err))
			.then(process => {
				process.stdout.on('data', forwardData('out'));
				process.stderr.on('data', forwardData('err'));

				process.on('close', (code) => {
					const endMsg: ProcessCompletion = {
						code
					};
					observer.next(endMsg);
					observer.complete();
				});
			});

		return function unsubscribe() {
			process_.then(process => process.kill('SIGINT'));
		};
	});

	return processObs.multicast(new Subject()).refCount();
}

/**
 * Converts any promise into a Process observable.
 *
 * On promise completion, the process will emit a ProcessCompletion object
 * with code 0 and complete.
 * On promise failure, it redirects the error to the observable.
 * @param promise promise to convert
 * @return process
 */
function fromPromise(promise: Promise<any>): Process {
	return Observable.create(subscriber => {
		promise
			.then(() => {
				subscriber.next({code: 0});
				subscriber.complete();
			})
			.catch(err => subscriber.error(err));
	});
}

function emptyProcess(code: number): Process {
	return of({code});
}

function success(): Process {
	return emptyProcess(0);
}

function error(code: number = 1): Process {
	return emptyProcess(code);
}

export default {
	execute,
	fromPromise,
	success,
	error
};
export {
	ProcessOptions,
	ProcessOutput,
	ProcessCompletion,
	ProcessMsg,
	Process,
	isOutput,
	isCompletion
};