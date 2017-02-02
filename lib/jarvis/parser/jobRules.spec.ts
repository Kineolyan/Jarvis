import { expect } from 'chai';
const _ = require('lodash');

import { MockIO } from '../interface/IOs';
import Dialog from '../interface/Dialog';
import {JobsRule} from './jobRules';
import { JobManager } from './../jobs/JobManager';

describe('JobsRule', function() {
	let rule: JobsRule;
	let manager: JobManager;
	let io: MockIO;

	beforeEach(function() {
		io = new MockIO(false);
		const dialog = new Dialog(io);
		manager = new JobManager(dialog);
		rule = new JobsRule(manager);
	});

	describe('#match', function() {
		it('detect jobs', function() {
			expect(rule.match('jobs')).to.eql(true);
			expect(rule.match('jobs \n\t')).to.eql(true);
		});
	});

	describe('#execute', function() {
		it('prints the list of jobs', function() {
			rule.execute('jobs');
			expect(io.out).to.have.length(1);

			const message = io.out[0];
			expect(message).to.match(/Jobs at \d{1,2}h\d{1,2}/)
				.and.to.contain('-- No jobs registered');
		});
	});
});