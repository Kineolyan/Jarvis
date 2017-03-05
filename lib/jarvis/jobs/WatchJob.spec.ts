import * as _ from 'lodash';
import {expect} from 'chai';
import * as fs from 'fs';

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

const noopLogger: Logger = {
	log: _.noop,
	error: _.noop
};

describe('Jarvis::Jobs::WatchExecutor', () => {
	describe('#run', () => {
		let job;
		let executor: WatchExecutor;

		beforeEach(() => {
			job = {
				stack: [],
				resolve(i) {
					const call = this.stack[i];
					if (_.isFunction(call)) {
						call();
					} else {
						throw new Error(`Call ${i} is not a resolver`);
					}
				},
				execute() {
					/* Records the call execution and optionally resolves the listener */
					const execution = new Promise(resolve => this.stack.push(resolve));
					if (this._resolve) {
						this._resolve();
					}

					return Promise.resolve();
				},
				stop() {
					if (this._reject) {
						this._reject(new Error('Unexpected stoppage of the job'));
					}
				},
				waitForExecution(nb) {
					return new Promise((resolve, reject) => {
						this._resolve = () => {
							if (this.stack.length >= nb) {
								resolve();
							}
					 	};
						this._reject = reject;

						this._resolve();
					});
				}
			};
			executor = new WatchExecutor(job, noopLogger);
		});

		it('runs the given job', () => {
			executor.run();

			job.resolve(0);
			return job.waitForExecution(1);
		});

		it('stacks calls until the previous completed', () => {
			executor.run();
			executor.run();

			expect(job.stack).to.have.length(1, 'Only one call');
		});

		it('restarts job if any request was made during the execution', () => {
			executor.run();
			executor.run();

			expect(job.stack).to.have.length(1, 'Only one call');
			job.resolve(0);

			return job.waitForExecution(2);
		});

		it('only restarts once even if many executions were requested during progress', () => {
			executor.run();
			executor.run();
			executor.run();
			executor.run();
			executor.run();

			job.resolve(0);
			return job.waitForExecution(2)
				.then(() => {
					job.resolve(1);

					executor.run();
					job.waitForExecution(3);
				});
		});
	});
});

describe('Jarvis::Jobs::WatchJob', () => {
	const watchedFilePath = `/tmp/jarvis-${Date.now()}`;
	let logWatcher;
	let job: WatchJob;

	beforeAll(done => {
		// Ensure the file exists
		fs.writeFile(watchedFilePath, 'init', done);
	});

	beforeEach(() => {
		logWatcher = {
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
			{logger: logWatcher, debounceTime: 50}
		);
	});

	describe('#execute', () => {
		let timerId, updateFile;
		beforeEach(() => {
			job.execute();

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
			return logWatcher.waitForOutput(1)
				.then(() => {
					expect(logWatcher.output[0][1]).to.eql('job executed\n');
				});
		});
	});

	describe('#stop', () => {
		// Very complicated to check that after stop, nothing happpens, except with timeout
	});
});