import {ProcessRule} from '../parser/Rule';

import ExecutionManager from './program/ExecutionManager';

class ResumeLearningRule extends ProcessRule {
	constructor(private _executionMgr: ExecutionManager){
		super(
			/^\s*resume (\d+)\s*$/,
			args => this.resumeLearning(args)
		);
	}

	resumeLearning(args) {
		const executionId = parseInt(args[1]);

		return
	}

}

export default ResumeLearningRule;