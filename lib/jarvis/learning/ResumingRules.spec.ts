import {expect} from 'chai';

import {ResumeLearningRule, DropLearningRule} from './ResumingRules';
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

describe('Jarvis::learning::DropLearningRule', () => {
	describe('#execute', () => {
		let executionMgr: ExecutionManager;
		let rule: DropLearningRule;

		beforeEach(() => {
			executionMgr = new ExecutionManager();
			rule = new DropLearningRule(executionMgr);
		});

		it('drops the wanted execution', () => {
			let flag = {resumed: false};
			const execId = executionMgr.postPone({
				resume: () => flag.resumed = true
			});
			return rule.execute(`drop ${execId}`)
				.progress
				.filter(isCompletion)
				.first()
				.toPromise()
				.then((msg: ProcessCompletion) => {
					expect(msg.code).to.eql(0);
					expect(flag.resumed).to.eql(false, 'Operation not resumed');
					expect(executionMgr.has(execId)).to.eql(false, 'Execution deleted');
				});
		});

		it('fails if the execution does not exist', () => {
			return rule.execute('drop 123')
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
