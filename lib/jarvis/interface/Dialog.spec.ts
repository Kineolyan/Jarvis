const _ = require('lodash');
import {expect} from 'chai';

import Dialog from './Dialog';
import { MockIO } from './IOs';

describe('Jarvis.Interface.Dialog', function() {
	beforeEach(function() {
		this.io = new MockIO();
		this.dialog = new Dialog(this.io);
	});

	describe('#say', function() {
		beforeEach(function() {
			this.dialog.say('Hello Sir');
		});

		it('outputs the message prefixed by Jarvis', function() {
			expect(this.io.out).to.eql(['[Jarvis]>> Hello Sir\n']);
		});

		it('prints nothing on error', function() {
			expect(this.io.err).to.be.empty;
		});
	});

	describe('#report', function() {
		beforeEach(function() {
			this.dialog.report('Ough');
		});

		it('outputs the error prefixed by Jarvis', function() {
			expect(this.io.err).to.eql(['[Jarvis]!! Ough\n']);
		});

		it('prints nothing on output', function() {
			expect(this.io.out).to.be.empty;
		});
	});

	describe('#ask', function() {
		beforeEach(function () {
			_.times(2, i => this.io.input(`Say ${i + 1}`));
			return this.dialog.ask('What to do?').then(response => { this.response = response });
		});

		it('outputs the question', function() {
			expect(this.io.out).to.eql(['[Jarvis]>> What to do?']);
		});

		it('gets the user input', function () {
			expect(this.response).to.eql('Say 1');
		});
	});
});
