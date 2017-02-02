const _ = require('lodash');

import Rule, {RuleAction} from './Rule';
import Dialog from '../interface/Dialog';
import JobManager from './../jobs/JobManager';

class JobsRule extends Rule {
	constructor(private _jobMgr: JobManager) {
		super(
			/^jobs\s*$/,
			args => {
				const now = new Date();
				this._jobMgr.printJobs();
				return { asynchronous: false, progress: Promise.resolve() };
			}
		)
	}
}

export {JobsRule};