import { expect } from 'chai';

import {DynamicWatchRule} from './basicRules';

describe('DynamicWatchRule', () => {
	describe('#getDefinition', () => {
		function getDefinition(input) {
			const rule = new DynamicWatchRule(null, null);
			const args = (rule as any)._expr.exec(input);
			return rule.getDefinition(args);
		}

		it('gets the path to watch and command', () => {
			const definition = getDefinition('watch /some/path and do "ls"');
			expect(definition.files).to.eql('/some/path');
			expect(definition.cmd.cmd).to.eql('ls');
			expect(definition.cmd.cwd).not.to.be.undefined;
		});

		it('handles optional exec dir with quotes', () => {
			const definition = getDefinition('watch /some/path and do \'ls\' in "some/other path"');
			expect(definition.cmd.cmd).to.eql('ls');
			expect(definition.cmd.cwd).to.eql('some/other path');
		});

		it('handles all without quotes', () => {
			const definition = getDefinition('watch /some/path and do jarvis in a/custom/path');
			expect(definition.cmd.cmd).to.eql('jarvis');
			expect(definition.cmd.cwd).to.eql('a/custom/path');
		});

		it('avoids tricky "in" in command', () => {
			const d1 = getDefinition('watch path and do "exec jarvis in /tmp"');
			expect(d1.cmd.cmd).to.eql('exec jarvis in /tmp');
		});
	});
});