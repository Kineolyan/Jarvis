import {ExecDefinition} from '../../jobs/ExecJob';
import JobManager, {JobRecord} from '../../jobs/JobManager';
import Program from '../program/Program';

interface ProgramStep {
  program: Program;
  stepIdx: number;
}

interface Execution {
  job: ExecDefinition;
  step?: ProgramStep;
}

type Recovery = Promise<boolean>;
export default class RecoveryManager {
  constructor(private _jobMgr: JobManager) {}

  recoverFrom(execution: Execution, job: JobRecord): Recovery {
    return Promise.resolve(false);
  }

  private tryProgramRecovery(execution: Execution, step: ProgramStep): Recovery | undefined {
    return undefined;
  }
}