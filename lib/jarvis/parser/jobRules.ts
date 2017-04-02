import * as _ from 'lodash';

import Rule, {ProcessRule} from './Rule';
import Dialog from '../interface/Dialog';
import JobManager from './../jobs/JobManager';
import Process from '../system/Process';

class JobsRule extends ProcessRule {
	constructor(private _jobMgr: JobManager) {
		super(
			/^jobs\s*$/,
			args => this.printJobs()
		)
	}

	printJobs() {
		const now = new Date();
		this._jobMgr.printJobs();
		return {
			asynchronous: false,
			progress: Process.success()
		};
	}
}

export {JobsRule};