import {expect} from 'chai';

import {MockIO} from '../../interface/IOs';
import Dialog from '../../interface/Dialog';
import {InterpreterChecker} from '../../parser/Interpreter';

import InspectRule from './InspectRule';

describe('Jarvis::learning::inspect::InspectRule', () => {
	let rule: InspectRule;
	let io: MockIO;

	beforeEach(() => {
		io = new MockIO(false);
    const dialog = new Dialog(io);
		rule = new InspectRule(dialog, null);
	});

  it('has correct rules matching', () => {
    new InterpreterChecker().fromInstance((<any>rule)._interpreter)
			.addMatches('HelpRule',
				'help',
        'help me')
      .addMatches('JobsRule',
        'show jobs',
        'list jobs')
      .addMatches('JobLogRule',
        'show logs for job 132')
      .addMatches('LookForRule',
        'look for /asdf/ in job 39',
        'look for /as(\\w)*?$/ in job 39',
        'look for /asdf/gi in job 39')
      .runTests();
  });
});