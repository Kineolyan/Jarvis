import { expect } from 'chai';

import { MockIO } from '../interface/IOs';
import Dialog from '../interface/Dialog';
import {RecordRule, ClearRule} from './autoRules';
import {Store} from '../storage/Store';

describe('RecordRule', function() {
	let rule: RecordRule,
		io: MockIO,
		store: Store;

	beforeEach(function() {
		io = new MockIO(true);
		store = new Store().forTests();

		const dialog = new Dialog(io);
		rule = new RecordRule(dialog, store);
	});

	describe('#match', function() {
		it('detect {record "action"}', function() {
			expect(rule.match('record "action"')).to.eql(true);
		});
	});

	describe('#execute', function() {
		beforeEach(function() {
			io.input('do something', 'nowhere');
			this.result = rule.execute('record "action"');
			return this.result.progress;
		});

		it('creates a synchronous result', function() {
			expect(this.result.asynchronous).to.eql(false);
		});

		it('asks for the command', function() {
			expect(io.out[0]).to.match(/>> Command to execute: \s*/);
		});

		it('asks the path for the command', function() {
			expect(io.out[1]).to.match(/>> Pwd for command \(opt\.\): \s*/);
		});

		it('creates the rule', function() {
			const tasks = store.get('execs');
			expect(tasks.action).to.eql({
				cmd: 'do something',
				cwd: 'nowhere'
			});
		});

		it('supports optional path', function() {
			io.input('do.THE.thing', '');
			return rule.execute('record "do-thing"')
				.progress.then(() => {
					const tasks = store.get('execs');
					expect(tasks['do-thing']).to.eql({ cmd: 'do.THE.thing' });
				});
		});
	});
});

describe('ClearRule', function() {
	let rule: ClearRule,
		store: Store;

	beforeEach(function() {
		store = new Store().forTests();
		store.add('execs', 'action', { cmd: 'cmd ' });

		rule = new ClearRule(store);
	});

	describe('#match', function() {
		it('detect {clear "action"}', function() {
			expect(rule.match('clear "action"')).to.eql(true);
		});
	});

	describe('#execute', function() {
		beforeEach(function() {
			return rule.execute('clear "action"');
		});

		it('deletes the task from the store', function() {
			const tasks = store.get('execs');
			expect(tasks).not.to.contain.keys(['action']);
		});
	});
});