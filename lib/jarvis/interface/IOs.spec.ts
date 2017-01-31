import { RuleAction } from './../parser/Rule';
import {StringIO} from './IOs';

describe('AIO', function() {
	beforeEach(function() {
		this.io = new StringIO();
	});

	describe('#question', function() {
		it('asks a question and returns the answer as promise', function() {
			const expectations = this.io.question('Who are you ?')
				.then(answer => expect(answer).toEqual('Simply the best'));
			this.io.input('Simply the best');

			return expectations;
		});

		it.skip('supports many questions', function() {
			this.io.input('Here', 'Trick', 'hello', 'wordl', 'are', 'you', 'listening');
			const expectations = this.io.question('When ?')
				.then((...args) => {
					console.log(args);
					const [a1] = args;
					expect(a1).toEqual('Here');
					const exs = this.io.question('What ?')
				console.log('2');

					return exs;
				})
				.then(a2 => {expect(a2).toEqual('Trick');
				console.log(3);
				});
			console.log('1');

			return expectations;
		});

		it.skip('supports multiple questions simultaneously', function () {
			this.io.input('In the kitchen', 'Brian');

			return Promise.all([
				this.io.question('Who killed ?'),
				this.io.question('Where was the kill ?')
			]).then(([who, where]) => {
				expect(who).toEqual('Brian');
				expect(where).toEqual('In the kitchen');
			});
		});
	});
});