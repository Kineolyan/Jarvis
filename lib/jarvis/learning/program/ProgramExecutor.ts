import * as _ from 'lodash';
import {Subject} from 'rxjs';

import {ProcessMsg, Process} from '../../system/Process';
import ExecJob, {ExecDefinition} from '../../jobs/ExecJob';
import JobManager, {JobRecord} from '../../jobs/JobManager';
import * as Maybe from '../../func/Maybe';

import Program from './Program';
import ExecutionManager, {Execution} from './ExecutionManager';

const executionMgr: ExecutionManager = new ExecutionManager; // FIXME use real instance
class ProgramExecutor {
  private _step: number;
  private _subject: Subject<ProcessMsg>;

  constructor(private _program: Program, private _jobMgr: JobManager) {
    this._step = -1;
  }

  execute(): Process {
    if (this._step >= 0) {
      throw new Error('Process already started');
    }

    this._subject = new Subject<ProcessMsg>();
    this.runNextStep();

    return this._subject;
	}

  runNextStep() {
    const nextStep = this._step + 1;
    if (nextStep < this._program.steps.length) {
      const step = this._program.steps[nextStep];
      const execution = new ExecJob(step).execute();
      const jobId = this._jobMgr.registerJob(execution, `Step ${nextStep} of program ${this._program.name}`);
      const job = this._jobMgr.getJob(jobId);
      if (job) {
        this._step = nextStep;
        job.completion.then(
          report => this.completeStep(report),
          err => this.failExecution(err)
        );
      } else {
        throw new Error('Step job not found in the middle of the process');
      }
    } else {
      // Complete the execution
      this._subject.next({code: 0});
      this._subject.complete();
    }
  }

  failExecution(err): void {
    this._subject.error(err);
  }

  completeStep(report: JobRecord): void {
    if (report.code === 0) {
      this._subject.next({
        source: 'out',
        data: `Step ${this._step} od ${this._program.name} completed with success`
      });

      this.runNextStep();
    } else {
      // TODO offer some way to resume the operation from here
      this._subject.next({
        source: 'err',
        data: `Step ${this._step} of ${this._program.name} failed`
      });

      const execId = executionMgr.postPone({
        resume: this.resume
      });

      this._subject.next({code: 2});
      this._subject.complete();
    }
  }

  resumeStep() {
    
  }
}

export default ProgramExecutor;