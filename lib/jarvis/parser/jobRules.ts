import * as _ from 'lodash';

import Rule, {RuleAction} from './Rule';
import Dialog from '../interface/Dialog';
import JobManager from './../jobs/JobManager';
import Process from '../system/Process';

class JobsRule extends Rule {
	constructor(private _jobMgr: JobManager) {
		super(
			/^jobs\s*$/,
			args => {
				const now = new Date();
				this._jobMgr.printJobs();
				return {
					asynchronous: false,
					progress: Process.success()
				};
			}
		)
	}
}

export {JobsRule};