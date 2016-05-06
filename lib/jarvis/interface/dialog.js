/**
 * Facade providing methods to enable dialogs between a user and the IA.
 * This acts from the point of view of the IA
 */
export class Dialog {
	/**
	 * Constructor.
	 * @param {IO} io IO to use to communicate with users
	 */
	constructor(io) {
		this.io = io;
		this._name = 'Jarvis'; // To replace by Summer
	}

	set name(name) {
		this._name = name;
	}

	/**
	 * Says something to the user
	 * @param {String} message message to say
	 */
	say(message) {
		this.io.prompt(`[${this._name}]>> ${message}`);
	}

	/**
	 * Reports an error to the user.
	 * @param {String} message message to report
	 */
	report(message) {
		this.io.report(`[${this._name}]!! ${message}`);
	}

	/**
	 * Asks a question to the user.
	 * This blocks until the user replies
	 * @param {String} question
	 * @return {Promise} user response
	 */
	ask(question) {
		return this.io.question(`[${this._name}]>> ${question ? question : ''}`);
	}
}

export default Dialog;
