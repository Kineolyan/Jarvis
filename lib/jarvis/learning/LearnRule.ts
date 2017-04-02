import { Observable, Observer } from 'rxjs';

import { Interpreter } from './../parser/Interpreter';
import Rule, {ProcessRule, ProcessResult, DefinitionResult} from '../parser/Rule';
import Dialog from '../interface/Dialog';
import Process from '../system/Process';
import * as Maybe from '../func/Maybe';

import ExecRule from './rules/ExecRule';

class LearnRule extends ProcessRule {
	private _interpreter: Interpreter<DefinitionResult>;

	constructor(private _dialog: Dialog) {
		super(
			/learn (?:'(.+?)'|"(.+?)"|([a-z].+)$)/,
			args => this.learnTask(args)
		)
		this._interpreter = new Interpreter<DefinitionResult>();
		this._interpreter.rules.push(new ExecRule(this._dialog));
	}

	learnTask(args: any): ProcessResult {
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
					const result = this._interpreter.interpret(action);
					if (Maybe.isDefined(result)) {
						return result.progress
							.then(actionResult => observer.next(actionResult))
							.then(() => this.captureAction(observer, false));
					} else {
						this._dialog.report('Cannot understand the action. Try again');
						return this.captureAction(observer, false);
					}
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