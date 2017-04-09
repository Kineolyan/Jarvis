import { ExecDefinition } from './../jobs/ExecJob';

interface Program {
	name: string;
	steps: ExecDefinition[];
};

export default Program;