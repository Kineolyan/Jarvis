const _ = require('lodash');
const rl = require('readline');
import { Readable, Writable } from 'stream';
import ExecJob from '../jobs/ExecJob';

class StringReadable extends Readable {
	public inputs: Array<string>;
	constructor(opts?: any) {
		super(opts);
		this.inputs = [];
	}

	_read() {
		// The answer lies here
		let input = this.inputs.shift();
		if (input) {
			this.push(`${input}\n`);
		} else {
			this.push(null);
		}
	}
}

class StringWritable extends Writable {
	public content: Array<string>;
	constructor(opts?: any) {
		super(opts);
		this.content = [];
	}

	_write(chunk, encoding, callback) {
		const lastValue = _.last(this.content);
		const value = chunk.toString('utf8');
		if (lastValue === undefined || _.last(lastValue) === '\n') {
			this.content.push(value);
		} else {
			this.content[this.content.length - 1] += value;
		}

		if (callback !== undefined) {
			callback();
		}
	}
}

interface IO {
	prompt(message: string, lineFeed?: boolean): void;
	question(message: string): Promise<any>;
	report(message: string): void;
}

class AIO implements IO {
	private _intf: any;
	private _questionStack: {question: string, resolve: any}[];

	constructor(
		protected _in: NodeJS.ReadableStream,
		protected _out: NodeJS.WritableStream,
		protected _err: NodeJS.WritableStream) {
		this._intf = rl.createInterface({
			input: this._in, output: this._out,
			completer: this.complete.bind(this)
		});
		this._intf.setPrompt('>');
		this._questionStack = [];
	}

	prompt(message, lineFeed = true) {
		this.output(this._out, message);
	}

	report(message: string) {
		this.output(this._out, message);
	}

	question(message) {
		return new Promise((resolve, reject) => {
			const hadQuestions = _.isEmpty(this._questionStack);

			this._questionStack.push({resolve, question: message});
			if (hadQuestions) {
				try {
					this._intf.question(message, this.answerQuestion.bind(this));
				} catch (err) {
					reject(err);
				}
			}
		});
	}

	private output(out: NodeJS.WritableStream, message: string) {
		const currentQuestion = _.last(this._questionStack);
		rl.clearLine(this._out, 0);
		rl.cursorTo(this._out, 0);
		if (currentQuestion) {
			// Previous line was a question, erase
			// Roll-up the previous question, by the number of lines
			let nbLines = 0;
			for (let i = 0; i < currentQuestion.question.length; i += 1) {
				if (currentQuestion.question[i] === '\n') {
					rl.moveCursor(this._out, 0, -1);
					rl.clearLine(this._out, 1);
				}
			}
		}

		this._out.write(message);
		this._out.write('\n');

		if (currentQuestion) {
			// Prompt last question again and set cursor after that
			this._out.write(currentQuestion.question);
			this._intf.write(' ');
			this._intf.write(null, {name: 'backspace'});
		}
	}

  private  answerQuestion(answer) {
		const question = this._questionStack.pop();
		if (question) {
			const {resolve} = question;
			resolve(answer);

			if (!_.isEmpty(this._questionStack)) {
				// Ask again the previous question
				const {question: previousQuestion} = _.last(this._questionStack);
				this._intf.question(previousQuestion, this.answerQuestion.bind(this));
			}
		} else {
			throw new Error('No question to pop');
		}
	}

	// TODO Move this somewhere else
	/**
	 * Completes the line for user.
	 * @private
	 * @param {String} line content to complete
	 * @returns {String[]} completions
	 */
	complete(line: string, cbk) {
		Promise.all([
			Promise.resolve([
				'quit', 'exit',
				'record \'', 'record "',
				'show logs for job '
			]),
			ExecJob.tasks()
				.then(values => _(values)
					.keys()
					.map(cmd => [`run '${cmd}'`, `clear '${cmd}'`])
					.flatten()
					.value()
				)
		]).then(_.flatten)
			.then((completions: string[]) => {
				const hits = completions.filter(c => c.startsWith(line));
				// show all completions if none found
				cbk(null, [hits.length ? hits : completions, line]);
			})
			.catch(error => cbk(error));
	}
}

/**
 * Representation of a StdIO
 * This contains methods to output content in the IO and reads inputs
 */
class StdIO extends AIO {
	constructor() {
		super(process.stdin, process.stdout, process.stdout);
	}

	report(message) {
		console.error(message); // eslint-disable-line no-console
	}
}

/**
 * IO working with strings.
 * This is mainly interesting for tests.
 */
class StringIO extends AIO {
	constructor(options = {in: null, out: null, err: null}) {
		super(
			options.in || new StringReadable(),
			options.out || new StringWritable(),
			options.err || new StringWritable()
		);
	}

	get in() {
		return this._in;
	}

	get out() {
		return this._out;
	}

	get err() {
		return this._err;
	}

	input(...values) {
		(this._in as StringReadable).inputs.push(...values);
	}
}

class MockIO implements IO {
	public inputs: Array<string|Promise<string>>;
	public out: Array<string>;
	public err: Array<string>;

	/**
	 * Constructor.
	 * @param _lnOnQuestion jump to the next line on question
	 */
	constructor(private _lnOnQuestion: boolean = false) {
		this.inputs = [];
		this.out = [];
		this.err = [];
	}

	prompt(message, lineFeed = true) {
		if (_.isEmpty(this.out) || _.last(_.last(this.out)) === '\n') {
			this.out.push('');
		}
		this.out[this.out.length - 1] += `${message}${lineFeed ? '\n' : ''}`;
	}

	question(message) {
		this.prompt(message, this._lnOnQuestion);
		const input = this.inputs.shift();
		if (input !== undefined) {
			return input instanceof Promise ? input : new Promise(resolve => resolve(input));
		} else {
			throw new Error('no value for input');
		}
	}

	report(message) {
		this.err.push(`${message}\n`);
	}

	input(...values): MockIO {
		this.inputs.push(...values);
		return this;
	}
}

export {
	// Interfaces
	IO,
	// Implementations
	StringReadable,
	StringWritable,
	AIO,
	StdIO,
	StringIO,
	MockIO
};