import { Observable, Observer } from 'rxjs';

import { Interpreter } from './../parser/Interpreter';
import Rule, {RuleResult} from '../parser/Rule';
import Dialog from '../interface/Dialog';
import Process from '../system/Process';

class LearnRule extends Rule {
	private _interpreter: Interpreter;

	constructor(private _dialog: Dialog) {
		super(
			/learn (?:'(.+?)'|"(.+?)"|([a-z].+)$)/,
			args => this.learnTask(args)
		)
		this._interpreter = new Interpreter();
	}

	learnTask(args: any): RuleResult {
		const taskName = args[1] || args[2] || args[3];
		this._dialog.say(`Perfect. Let's define this.`);
		const progress = this.requestDefinition()
			.reduce(
				(commands, action) => {
					commands.push(action);
					return commands;
				},
				[]
			).map(commands => {
				const commandList = commands.map((c, i) => ` #${i + 1} - ${c}`).join('\n');
				this._dialog.say(`You defined ${taskName} as:\n${commandList}`);

				return {code: 0};
			});

		return {
			asynchronous: false,
			progress: progress
		};
	}

	captureAction(observer: Observer<string>, first: boolean): Promise<string> {
		return this._dialog.ask(`What to do ${first ? 'first' : 'then'}? `)
			.catch(err => observer.error(err))
			.then(action => {
				if (/\s*done\s*/.test(action)) {
					observer.complete();
				} else {
					observer.next(action);
					return this.captureAction(observer, false);
				}
			});
	}

	requestDefinition(): Observable<string> {
		return Observable.create(observer => {
			this.captureAction(observer, true);
		});
	}
}

export default LearnRule;