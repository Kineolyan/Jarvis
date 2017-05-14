import {expect} from 'chai';

import ResumeLearningRule from './ResumeLearningRule';
import ExecutionManager from './program/ExecutionManager';
import {isCompletion, ProcessCompletion} from '../system/Process';

describe('Jarvis::learning::ResumeLearningRule', () => {
	describe('#execute', () => {
		let executionMgr: ExecutionManager;
		let rule: ResumeLearningRule;

		beforeEach(() => {
			executionMgr = new ExecutionManager();
			rule = new ResumeLearningRule(executionMgr);
		});

		it('resumes the wanted execution', () => {
			let flag = {resumed: false};
			const execId = executionMgr.postPone({
				resume: () => flag.resumed = true
			});
			return rule.execute(`resume ${execId}`)
				.progress
				.filter(isCompletion)
				.first()
				.toPromise()
				.then((msg: ProcessCompletion) => {
					expect(msg.code).to.eql(0);
					expect(flag.resumed).to.eql(true, 'Operation resumed');
				});
		});

		it('fails if the execution does not exist', () => {
			return rule.execute('resume 123')
				.progress
				.filter(isCompletion)
				.first()
				.toPromise()
				.then((msg: ProcessCompletion) => {
					expect(msg.code).not.to.eql(0);
				});
		});
	});
});