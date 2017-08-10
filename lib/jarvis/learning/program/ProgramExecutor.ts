import * as _ from 'lodash';
import { Subject, ReplaySubject, Scheduler } from 'rxjs';

import Dialog from './../../interface/Dialog';
import {ProcessMsg, Process} from '../../system/Process';
import ExecJob, {ExecDefinition} from '../../jobs/ExecJob';
import JobManager, {JobRecord} from '../../jobs/JobManager';
import RecoveryManager from '../recovery/RecoveryManager';
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
      private _recoveryMgr: RecoveryManager,
      private _dialog: Dialog) {
    this._step = -1;
  }

  execute(): Process {
    if (this._step >= 0) {
      throw new Error('Process already started');
    }

    this._subject = new ReplaySubject<ProcessMsg>(5);
    this.runNextStep();

    return this._subject.observeOn(Scheduler.async);
	}

  runNextStep() {
    const nextStep = this._step + 1;
    if (nextStep < this._program.steps.length) {
      this.runStep(nextStep);
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
      this._recoveryMgr.recoverFrom(
        {
          job: this._program.steps[this._step],
          step: {
            program: this._program,
            stepIdx: this._step
          }
        },
        report)
        .then(recovered => recovered
          ? this.runNextStep()
          : this.postPoneStep());
    }
  }

  postPoneStep() {
    const execId = this._executionMgr.postPone({
      resume: this.resumeStep.bind(this)
    });

    this._subject.next({
      source: 'err',
      data: `Step ${this._step} of ${this._program.name} failed. Resume execution ${execId} to continue.`
    });
    this._dialog.say(`Execution of ${this._program.name} stopped at step ${this._step}. Resume execution ${execId} to continue.`);
  }

  resumeStep() {
    this.runStep(this._step);
  }

  runStep(stepIdx: number) {
    const step = this._program.steps[stepIdx];
    const execution = new ExecJob(step).execute();
    const jobId = this._jobMgr.registerJob(execution, `Step ${stepIdx} of program ${this._program.name}`);
    this._subject.next({
      source: 'out',
      data: `Step ${stepIdx} execution registered as job ${jobId}`
    });
    const job = this._jobMgr.getJob(jobId);
    if (job) {
      this._step = stepIdx;
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