import Process from '../system/Process';
import {ProcessRule} from '../parser/Rule';

import ExecutionManager from './program/ExecutionManager';

class ResumeLearningRule extends ProcessRule {
	constructor(private _executionMgr: ExecutionManager){
		super(
			/^\s*resume (?:execution (?:of )?)?(\d+)\s*$/,
			args => this.resumeLearning(args)
		);
	}

	resumeLearning(args) {
		const executionId = parseInt(args[1], 10);
		let progress;
		if (this._executionMgr.has(executionId)) {
			this._executionMgr.resume(executionId);
			progress = Process.success();
		} else {
			progress = Process.error(1);
		}

		return {
			asynchronous: false,
			description: `Resuming execution ${executionId}`,
			progress
		};
	}

}

class DropLearningRule extends ProcessRule {
	constructor(private _executionMgr: ExecutionManager) {
		super(
			/^\s*(?:drop|cancel) (?:execution (?:of )?)?(\d+)\s*$/,
			args => this.dropLearning(args)
		);
	}

	dropLearning(args) {
		const executionId = parseInt(args[1], 10);
		let progress;
		if (this._executionMgr.has(executionId)) {
			this._executionMgr.drop(executionId);
			progress = Process.success();
		} else {
			progress = Process.error(1);
		}

		return {
			asynchronous: false,
			description: `Dropping execution ${executionId}`,
			progress
		};
	}
}

export {
	ResumeLearningRule,
	DropLearningRule
};