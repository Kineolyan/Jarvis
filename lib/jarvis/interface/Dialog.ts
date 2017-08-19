import { IO } from './IOs';
import * as Maybe from '../func/Maybe';

interface DelayedQuestion {
	id: number;
	question: string;
	resolve: (any) => void;
	reject: (Error) => void;
}

/**
 * Facade providing methods to enable dialogs between a user and the IA.
 * This acts from the point of view of the IA
 */
class Dialog {
	private _name: string;
	private _questionInProgress: boolean;
	private _delayedQuestions: DelayedQuestion[];
	private _questionId: number;

	/**
	 * Constructor.
	 * @param {IO} io IO to use to communicate with users
	 */
	constructor(public io: IO) {
		this._name = 'Jarvis';
		this._questionInProgress = false;
		this._delayedQuestions = [];
		this._questionId = 0;
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
		if (!this._questionInProgress) {
			return this.askQuestion(question);
		} else {
			return new Promise((resolve, reject) => {
				this._delayedQuestions.push({
					id: ++this._questionId,
					question, 
					resolve, 
					reject
				});
			});
		}
	}

	private askQuestion(question: string): Promise<any> {
		const q = this.io.question(`[${this._name}]>> ${question ? question : ''}`);
		// We waited for the question to be created
		this._questionInProgress = true;
		// Always reset the state before dispatching the answer
		return q.then(
			answer => {
				this._questionInProgress = false; 
				return answer;
			}, 
			err => {
				this._questionInProgress =  false;
				return Promise.reject(err);
			});
	}

	getPendingQuestions(): {id: number, question: string}[] {
		return this._delayedQuestions;
	}

	askAgain(questionId: number): Promise<any> {
		if (this._questionInProgress) {
			throw new Error('A question is already in progress');			
		}

		const questionIdx = this._delayedQuestions.findIndex(q => q.id === questionId);
		if (questionIdx < 0) {
			throw new Error(`Question ${questionId} does not exist`);
		}

		const [{question, resolve, reject}] = this._delayedQuestions.splice(questionIdx, 1);
		const questionP = this.askQuestion(question);
		questionP.then(resolve, reject);

		return questionP;
	}
}

export default Dialog;
