import * as _ from 'lodash';
import {Subject} from 'rxjs';

import Dialog from './../../interface/Dialog';
import {ProcessMsg, Process} from '../../system/Process';
import ExecJob, {ExecDefinition} from '../../jobs/ExecJob';
import JobManager, {JobRecord} from '../../jobs/JobManager';
import * as Maybe from '../../func/Maybe';

import Program from './Program';
import ExecutionManager, {Execution} from './ExecutionManager';

class ProgramExecutor {
  private _step: number;
  private _subject: Subject<ProcessMsg>;

  constructor(
      private _program: Program,
      private _jobMgr: JobManager,
      private _executionMgr: ExecutionManager,
      private _dialog: Dialog) {
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
        data: `Step ${this._step} of ${this._program.name} completed with success`
      });

      this.runNextStep();
    } else {
      const execId = this._executionMgr.postPone({
        resume: this.resumeStep.bind(this)
      });

      this._subject.next({
        source: 'err',
        data: `Step ${this._step} of ${this._program.name} failed. Resume execution ${execId} to continue.`
      });
      this._dialog.say(`Execution of ${this._program.name} stopped at step ${this._step}. Resume execution ${execId} to continue.`);
    }
  }

  resumeStep() {
    const step = this._program.steps[this._step];
    const execution = new ExecJob(step).execute();
    const jobId = this._jobMgr.registerJob(execution, `Step ${this._step} of program ${this._program.name} (reboot)`);
    const job = this._jobMgr.getJob(jobId);
    if (job) {
      job.completion.then(
        report => this.completeStep(report),
        err => this.failExecution(err)
      );
    } else {
      throw new Error('Step job not found in the middle of the process');
    }
  }
}

export default ProgramExecutor;