import {ExecDefinition} from '../../jobs/ExecJob';
import {JobRecord} from '../../jobs/JobManager';

type RecoveryResult = Promise<JobRecord | boolean>;

interface RecoveryAction {
  canApply(job: JobRecord, execution?: ExecDefinition): Promise<boolean>
  apply(job: JobRecord, execution?: ExecDefinition): RecoveryResult
};

export default RecoveryAction;
export {
  RecoveryResult
};
