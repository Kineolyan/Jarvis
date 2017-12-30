import * as _ from 'lodash';

import Rule, {ProcessRule} from './Rule';
import Dialog from '../interface/Dialog';
import JobManager from './../jobs/JobManager';
import Process from '../system/Process';

class JobsRule<T> extends Rule<T> {
	constructor(private _jobMgr: JobManager, private _result: T) {
		super(
			/^(?:(?:show|list) )?jobs\s*$/,
			args => this.printJobs()
		)
	}

	printJobs() {
		const now = new Date();
		this._jobMgr.printJobs();
		return this._result;
	}
}

class JobLogRule<T> extends Rule<T> {
	constructor(private _jobMgr: JobManager, private _dialog: Dialog, private _result: T) {
		// FIXME do tests for all the commands that should match
		// FIXME test that a command does not match multiple rules
		super(
			/^show logs? (?:of|for) job (\d+)/,
			args => this.displayLogs(args)
		);
	}

	displayLogs(args) {
		const jobId = parseInt(args[1]);
		this._jobMgr.logJob(jobId);

		return this._result;
	}
}

export {JobsRule, JobLogRule};