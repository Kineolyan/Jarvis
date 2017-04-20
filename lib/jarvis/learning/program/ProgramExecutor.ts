import * as _ from 'lodash';

import {ProcessMsg} from '../../system/Process';
import ExecJob, {ExecDefinition} from '../../jobs/ExecJob';
import JobManager, {JobRecord} from '../../jobs/JobManager';
import * as Maybe from '../../func/Maybe';

import Program from './Program';

class ProgramExecutor {
  constructor(private _program: Program, private _jobMgr: JobManager) {}

  execute(): Promise<ProcessMsg> {
		return _.reduce(
			this._program.steps,
			(progress: Promise<Maybe.Type<JobRecord>>, step: ExecDefinition, i: number) => progress
				.then((previousRecord) => {
					// Exit after a previous failure
					if (Maybe.isDefined(previousRecord) && previousRecord.code !== 0) {
						return Maybe.just(previousRecord);
					}

					const execution = new ExecJob(step).execute();
					const jobId = this._jobMgr.registerJob(execution, `Step ${i} of program ${this._program.name}`);
					const job = this._jobMgr.getJob(jobId);
					if (job) {
						return job.completion
							.then(Maybe.just);
					} else {
						throw new Error('Step job not found in the middle of the process');
					}
				}),
			Promise.resolve(Maybe.none())
		)
		.then(() => ({code: 0}));
	}
}

export default ProgramExecutor;