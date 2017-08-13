import { ExecDefinition } from './../../jobs/ExecJob';
import RecoveryAction from '../recovery/RecoveryAction';

interface Program {
	name: string;
	steps: ExecDefinition[];
	recoverySteps: RecoveryAction[][]
};

export default Program;