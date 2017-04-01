import * as _ from 'lodash';
import {expect} from 'chai';
import * as fs from 'fs';
import {Observable, Subject, Subscriber} from 'rxjs';

import {isOutput} from '../system/Process';
import WatchJob, {WatchExecutor} from './WatchJob';
import ExecJob from './ExecJob';
import {setStore, buildTestStore} from '../storage/Store';
import Logger from '../interface/Logger';

setStore(buildTestStore(mapping => {
  const execs = mapping.get('watches');
	if (execs) {
		execs.add('test', {
			files: '/tmp/jarvis-test.txt',
			cmd: {
				cmd: 'echo test'
			}
		});
	} else {
		throw new Error('watches mapping not configured');
	}
}));

describe('Jarvis::Jobs::WatchExecutor', () => {
	describe('#run', () => {
		let job;
		let executor: WatchExecutor;

		beforeEach(() => {
			job = {
				observers: [],
				execute() {
					return this.observable;
				},
				stop() { /* Nothing to do for tests so far */ },
				onObserver(subIdx: number, action: (s: Subscriber<any>) => void) {
					const s = this.observers[subIdx];
					if (s !== undefined) {
						action(s);
					} else {
						throw new Error(`No observers at ${subIdx}, try in [0, ${this.observers.length})`);
					}
				}
			};
			job.observable = Observable.create((observer) => {
				job.observers.push(observer);

				// return () => {
				// 	const i = job.observers.indexOf(observer);
				// 	if (i >= 0) {
				// 		job.observers.splice(i, 1);
				// 	}
				// }
			});
			executor = new WatchExecutor(job);
		});

		it('runs the given job', () => {
			executor.run();

			expect(job.observers).to.have.length(1);

			job.onObserver(0, subscriber => {
				subscriber.next({code: 0});
				subscriber.complete();
			});
		});

		it('stacks calls until the previous completed', () => {
			executor.run();
			executor.run();

			expect(job.observers).to.have.length(1);
		});

		it('restarts job if any request was made during the execution', () => {
			executor.run();
			executor.run();

			expect(job.observers).to.have.length(1);
			job.onObserver(0, subscriber => {
				subscriber.next({code: 0});
				subscriber.complete();
			});

			expect(job.observers).to.have.length(2);
		});

		it('only restarts once even if many executions were requested during progress', () => {
			executor.run();
			executor.run();
			executor.run();
			executor.run();
			executor.run();

			job.onObserver(0, subscriber => {
				subscriber.next({code: 0});
				subscriber.complete();
			});
			job.onObserver(1, subscriber => {
				subscriber.next({code: 1});
				subscriber.complete();
			});
			expect(job.observers).to.have.length(2);
			// No 3rd execution started even after 5 calls to run
		});
	});
});

describe('Jarvis::Jobs::WatchJob', () => {
	const watchedFilePath = `/tmp/jarvis-${Date.now()}`;
	let job: WatchJob;

	beforeAll(() => {
		// Ensure the file exists
		return new Promise((resolve, reject) => {
			try {
				fs.writeFile(watchedFilePath, 'init', err => {
					err ? reject(err): resolve();
				});
			} catch (err) {
				reject(err);
			}
		});
	});

	beforeEach(() => {
		const logWatcher = {
			output: [],
			log(...args) {
				this.output.push(args);
				if (this._resolve) {
					this._resolve();
				}
			},
			error(...args) {
				this.output.push(args);
				if (this._resolve) {
					this._resolve();
				}
			},
			waitForOutput(nb) {
				return new Promise((resolve, reject) => {
					this._resolve = () => {
						if (this.output.length >= nb) {
							resolve();
						}
					};
					this._reject = reject;

					this._resolve();
				});
			}
		};
		job = new WatchJob(
			{
				kind: 'cmd',
				files: watchedFilePath,
				cmd: {
					cmd: 'echo "job executed"'
				}
			},
			{debounceTime: 50}
		);
	});

	describe('#execute', () => {
		let timerId, updateFile;
		beforeEach(() => {
			let i = 0;
			updateFile = () => {
				timerId = setTimeout(
					() => {
						fs.writeFile(watchedFilePath, `write ${++i}`, updateFile);
					},
					150
				);
			};
		});

		afterEach(() => {
			if (timerId) {
				clearTimeout(timerId);
			}
			job.stop();
		});

		it('executes the cmd on file changes', () => {
			updateFile();
			return job.execute()
				.filter(isOutput)
				.take(2)
				.reduce(
					(msgs: string[], msg) => {
						msgs.push(msg.data);
						return msgs;
					},
					[]
				)
				.toPromise()
				.then(msgs => {
					expect(msgs).to.contain('[watch] job executed\n');
				});
		});
	});

	describe('#stop', () => {
		// Very complicated to check that after stop, nothing happpens, except with timeout
	});
});