import { expect } from 'chai';

import { MockIO } from '../interface/IOs';
import Dialog from '../interface/Dialog';
import {RecordRule, ClearRule} from './autoRules';
import {Store} from '../storage/Store';

describe('RecordRule', function() {
	beforeEach(function() {
		this.io = new MockIO(true);
		this.store = new Store().forTests();

		const dialog = new Dialog(this.io);
		this.rule = new RecordRule(dialog, this.store);
	});

	describe('#match', function() {
		it('detect {record "action"}', function() {
			expect(this.rule.match('record "action"')).to.eql(true);
		});
	});

	describe('#execute', function() {
		beforeEach(function() {
			this.io.input('do something', 'nowhere');
			return this.rule.execute('record "action"');
		});

		it('asks for the command', function() {
			expect(this.io.out[0]).to.match(/>> Command to execute: \s*/);
		});

		it('asks the path for the command', function() {
			expect(this.io.out[1]).to.match(/>> Pwd for command \(opt\.\): \s*/);
		});

		it('creates the rule', function() {
			const tasks = this.store.get('execs');
			expect(tasks.action).to.eql({
				cmd: 'do something',
				cwd: 'nowhere'
			});
		});

		it('supports optional path', function() {
			this.io.input('do.THE.thing', '');
			return this.rule.execute('record "do-thing"')
				.then(() => {
					const tasks = this.store.get('execs');
					expect(tasks['do-thing']).to.eql({ cmd: 'do.THE.thing' });
				});
		});
	});
});

describe('ClearRule', function() {
	beforeEach(function() {
		this.store = new Store().forTests();
		this.store.add('execs', 'action', { cmd: 'cmd ' });

		this.rule = new ClearRule(this.store);
	});

	describe('#match', function() {
		it('detect {clear "action"}', function() {
			expect(this.rule.match('clear "action"')).to.eql(true);
		});
	});

	describe('#execute', function() {
		beforeEach(function() {
			return this.rule.execute('clear "action"');
		});

		it('deletes the task from the store', function() {
			const tasks = this.store.get('execs');
			expect(tasks).not.to.contain.keys(['action']);
		});
	});
});