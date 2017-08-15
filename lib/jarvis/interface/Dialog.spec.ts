const _ = require('lodash');
import {expect} from 'chai';

import Dialog from './Dialog';
import { MockIO } from './IOs';

describe('Jarvis.Interface.Dialog', function() {
	let dialog: Dialog;
	let io; MockIO;

	beforeEach(function() {
		io = new MockIO();
		dialog = new Dialog(io);
	});

	describe('#say', function() {
		beforeEach(function() {
			dialog.say('Hello Sir');
		});

		it('outputs the message prefixed by Jarvis', function() {
			expect(io.out).to.eql(['[Jarvis]>> Hello Sir\n']);
		});

		it('prints nothing on error', function() {
			expect(io.err).to.be.empty;
		});
	});

	describe('#report', function() {
		beforeEach(function() {
			dialog.report('Ough');
		});

		it('outputs the error prefixed by Jarvis', function() {
			expect(io.err).to.eql(['[Jarvis]!! Ough\n']);
		});

		it('prints nothing on output', function() {
			expect(io.out).to.be.empty;
		});
	});

	describe('#ask', function() {
		describe('on question asked', () => {
			let response: string;

			beforeEach(function () {
				_.times(2, i => io.input(`Say ${i + 1}`));
				return dialog.ask('What to do?').then(_response => { response = _response });
			});

			it('outputs the question', function() {
				expect(io.out).to.eql(['[Jarvis]>> What to do?']);
			});

			it('gets the user input', function () {
				expect(response).to.eql('Say 1');
			});

			it('can answer another question then', () => {
				return dialog.ask('And then')
					.then(response => {
						expect(response).to.eql('Say 2');
					});
			});
		});

		describe('on multiple questions', () => {
			let promiseHandles;

			beforeEach(() => {
				const resolver = io.prepareInput();
				const p = dialog.ask('What to do first?');
				dialog.ask('What to do then?');
				dialog.ask('What to finally do?');
				
				resolver('something');
				return p;
			});

			it('stores pending questions', () => {
				const questions = dialog.getPendingQuestions().map(q => q.question);
				expect(questions)
					.to.contain('What to do then?')
					.and.to.contain('What to finally do?');
			});

			it('assigns an id to pending questions', () => {
				const qIds = dialog.getPendingQuestions().map(q => q.id);
				const qSet = new Set(qIds);
				expect(qSet.size).to.eql(qIds.length, `Identical elements in ${qIds}`);
			});
		});
	});

	describe('#askAgain', function() {
		let answers: string[];

		beforeEach(async () => {
			answers = [];

			const r1 = io.prepareInput();
			const p1 = dialog.ask('What to do first?\n');
			const p2 = dialog.ask('What to do then?\n');
			const p3 = dialog.ask('What to finally do?\n');
			
			r1('first answer');
			const a1 = await p1;
			answers.push(a1);

			const questions = dialog.getPendingQuestions();
			let q2, q3;
			if (questions[0].question === 'What to do then?\n') {
				q2 = questions[0];
				q3 = questions[1];
			} else {
				q3 = questions[0];
				q2 = questions[1];
			}

			const r3 = io.prepareInput();
			dialog.askAgain(q3.id);
			r3('second answer');
			const a2 = await p3;
			answers.push(a2);

			const r2 = io.prepareInput();
			dialog.askAgain(q2.id);
			r2('third answer');
			const a3 = await p2;
			answers.push(a3);

		});

		it('displayed all questions', () => {
			expect(io.out).to.eql([
				'[Jarvis]>> What to do first?\n',
				'[Jarvis]>> What to finally do?\n',
				'[Jarvis]>> What to do then?\n'
			]);
		});

		it('replied in correct order', () => {
			expect(answers).to.eql([
				'first answer',
				'second answer',
				'third answer'
			]);
		});
	});
});
