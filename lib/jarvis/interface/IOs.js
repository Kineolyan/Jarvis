import _ from 'lodash';
import rl from 'readline';
import { Readable, Writable } from 'stream';

export class StringReabable extends Readable {
	constructor(opts) {
		super(opts);
		this.inputs = [];
	}

	_read() {
		let input = this.inputs.shift();
		this.push(input !== undefined ? `${input}\n` : null);
	}
}

class StringWritable extends Writable {
	constructor(opts) {
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

class AIO {
	constructor(in_, out, err) {
		this._in = in_;
		this._out = out;
		this._err = err;
		this._intf = rl.createInterface({
			input: this._in, output: this._out,
			completer: this.complete.bind(this)
		});
	}

	prompt(message, lineFeed = true) {
		this._out.write(message);
		if (lineFeed) {
			this._out.write('\n');
		}
	}

	question(message) {
		return new Promise((resolve, reject) => {
			try {
				this._intf.question(message, function(answer) {
					resolve(answer);
				});
			} catch (err) {
				reject(err);
			}
		});
	}

	report(message) {
		this._err.write(`${message}\n`);
	}

	/**
	 * Completes the line for user.
	 * @private
	 * @param {String} line content to complete
	 * @returns {String[]} completions
	 */
	complete(line) {
		const completions = ['quit', 'exit'];
		const hits = completions.filter(c => c.startsWith(line));
		// show all completions if none found
		return [hits.length ? hits : completions, line]
	}
}

/**
 * Representation of a StdIO
 * This contains methods to output content in the IO and reads inputs
 */
export class StdIO extends AIO {
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
export class StringIO extends AIO {
	constructor({ in: in_, out, err } = {}) {
		super(
			in_ || new StringReabable(),
			out || new StringWritable(),
			err || new StringWritable()
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
		this._in.inputs.push(...values);
	}
}

export class MockIO {
	constructor() {
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
		this.prompt(message, false);
		const input = this.inputs.shift();
		if (input !== undefined) {
			return new Promise(resolve => resolve(input));
		} else {
			throw new Error('no value for input');
		}
	}

	report(message) {
		this.err.push(`${message}\n`);
	}

	input(...values) {
		this.inputs.push(...values);
	}
}
