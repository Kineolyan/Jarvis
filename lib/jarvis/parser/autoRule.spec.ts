import { expect } from 'chai';

import { MockIO } from '../interface/IOs';
import Dialog from '../interface/Dialog';
import { RuleResult } from './Rule';
import {RecordRule, ClearRule} from './autoRules';
import Store, {buildTestStore} from '../storage/Store';

describe('RecordRule', function() {
	let rule: RecordRule,
		io: MockIO,
		store: Store;

	beforeEach(function() {
		io = new MockIO(true);
		store = buildTestStore();

		const dialog = new Dialog(io);
		rule = new RecordRule(dialog, store);
	});

	describe('#match', function() {
		it('detect {record "action"}', function() {
			expect(rule.match('record "action"')).to.eql(true);
		});
	});

	describe('#execute', function() {
		let result: RuleResult;

		beforeEach(function() {
			io.input('do something', 'nowhere');
			result = rule.execute('record "action"');
			return result.progress.toPromise();
		});

		it('creates a synchronous result', function() {
			expect(result.asynchronous).to.eql(false);
		});

		it('asks for the command', function() {
			expect(io.out[0]).to.match(/>> Command to execute: \s*/);
		});

		it('asks the path for the command', function() {
			expect(io.out[1]).to.match(/>> Pwd for command \(opt\.\): \s*/);
		});

		it('creates the rule', function() {
			return store.get('execs').then(tasks => {
				expect(tasks.action).to.eql({
					cmd: 'do something',
					cwd: 'nowhere'
				});
			});
		});

		it('supports optional path', function() {
			io.input('do.THE.thing', '');
			return rule.execute('record "do-thing"').progress
				.toPromise()
				.then(() => store.get('execs'))
				.then(tasks => {
					expect(tasks['do-thing']).to.eql({ cmd: 'do.THE.thing' });
				});
		});
	});
});

describe('ClearRule', function() {
	let rule: ClearRule,
		store: Store;

	beforeEach(function() {
		const io = new MockIO(true);
		const dialog = new Dialog(io);
		store = buildTestStore();
		rule = new ClearRule(dialog, store);

		return store.add('execs', 'action', { cmd: 'cmd ' });
	});

	describe('#match', function() {
		it('detect {clear "action"}', function() {
			expect(rule.match('clear "action"')).to.eql(true);
		});
	});

	describe('#execute', function() {
		beforeEach(function() {
			return rule.execute('clear "action"').progress;
		});

		it('deletes the task from the store', function() {
			return store.get('execs')
				.then(tasks => {
					expect(tasks).not.to.contain.keys(['action']);
				});
		});
	});
});