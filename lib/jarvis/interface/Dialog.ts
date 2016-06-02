import { IO } from 'jarvis/interface/IOs';

/**
 * Facade providing methods to enable dialogs between a user and the IA.
 * This acts from the point of view of the IA
 */
export class Dialog {
	private _name: string;

	/**
	 * Constructor.
	 * @param {IO} io IO to use to communicate with users
	 */
	constructor(public io: IO) {
		this._name = 'Jarvis'; // To replace by Summer
	}

	set name(name: string) {
		this._name = name;
	}

	/**
	 * Says something to the user
	 * @param {String} message message to say
	 */
	say(message: string): void {
		this.io.prompt(`[${this._name}]>> ${message}`);
	}

	/**
	 * Reports an error to the user.
	 * @param {String} message message to report
	 */
	report(message: string): void {
		this.io.report(`[${this._name}]!! ${message}`);
	}

	/**
	 * Asks a question to the user.
	 * This blocks until the user replies
	 * @param {String} question question to ask
	 * @return {Promise} user response
	 */
	ask(question: string): Promise<any> {
		return this.io.question(`[${this._name}]>> ${question ? question : ''}`);
	}
}

export default Dialog;
