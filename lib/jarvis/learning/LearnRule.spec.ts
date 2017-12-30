import {expect} from 'chai';

import {MockIO} from '../interface/IOs';
import Dialog from '../interface/Dialog';
import Store, {buildTestStore} from '../storage/Store';
import {InterpreterChecker} from '../parser/Interpreter';

import LearnRule from './LearnRule';

describe('Jarvis::learning::LearnRule', () => {
	let rule: LearnRule;
	let store: Store;
	let io: MockIO;

	beforeEach(() => {
		io = new MockIO(false);
		const dialog = new Dialog(io);
		const store = buildTestStore();
		rule = new LearnRule(dialog, store);
	});

  it('has correct rules matching', () => {
    new InterpreterChecker().fromInstance((<any>rule)._interpreter)
			.addMatches('ExecRule',
				'exec git pull with "quoted" \'args\'',
				'exec "simple escaped command"',
				"exec 'other cmd'"
			)
			.addMatches('HelpRule',
				'help',
				'help me')
			.addTraps(
				'you may be tempted to exec the rest of this line'
			)
      .runTests();
  });
});