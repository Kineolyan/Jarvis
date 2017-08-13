import * as _ from 'lodash';

import {ExecDefinition} from '../../jobs/ExecJob';
import JobManager, {JobRecord} from '../../jobs/JobManager';
import Program from '../program/Program';
import Dialog from '../../interface/Dialog';

import RecoveryAction, {RecoveryResult} from './RecoveryAction';

interface ProgramStep {
  program: Program;
  stepIdx: number;
}

interface Execution {
  job: ExecDefinition;
  step?: ProgramStep;
}

type ExtRecovery = Promise<JobRecord | boolean | undefined>;
export default class RecoveryManager {
  private _dialog: Dialog;

  constructor(private _jobMgr: JobManager) {}

  async recoverFrom(execution: Execution, job: JobRecord): RecoveryResult {
    // Test first if the program knows how to fix itself
    if (execution.step) {
      const customRecovery = await this.tryProgramRecovery(execution, execution.step, job);
      if (customRecovery !== undefined) {
        return customRecovery || true;
      }
    }

    // Try general recovery operations
    // TODO code this
    const generalRecovery = await this.attemptRecoveries(execution, job);
    if (generalRecovery !== undefined) {
      return generalRecovery || true;
    }

    // Nothing worked
    return false;
  }

  private async tryProgramRecovery(execution: Execution, step: ProgramStep, job: JobRecord): ExtRecovery {
    const possibleRecoveries = step.program.recoverySteps[step.stepIdx];
    if (!_.isEmpty(possibleRecoveries)) {
      for (const recovery of possibleRecoveries) {
        if (await recovery.canApply(job, execution.job)) {
          const result = await recovery.apply(job, execution.job);
          if (result !== false) {
            return result;
          }
        }
      }
    }

    return undefined;
  }

  private async attemptRecoveries(execution: Execution, job: JobRecord): ExtRecovery {
    const possibleRecoveries = this.getPossibleRecoveries(execution, job);
    if (!_.isEmpty(possibleRecoveries)) {
      while (possibleRecoveries.length > 1) {
        // TODO how to display the list of recoveries
        const selection = await this._dialog.ask(`Which recovery? [0-${possibleRecoveries.length}] `);
        const [recovery] = possibleRecoveries.splice(parseInt(selection, 10), 1);
        const result = await recovery.apply(job, execution.job);
        if (result !== false) {
          // This recovery succeeded
          return result;
        } // else try another one
      }
      
      return possibleRecoveries[0].apply(job, execution.job);
    } else {
      return undefined;
    }
  }

  private getPossibleRecoveries(execution: Execution, job: JobRecord): RecoveryAction[] {
    // TODO get the recoveries
    // TODO how to rate recoveries to start with the best one
    return [];
  }
}