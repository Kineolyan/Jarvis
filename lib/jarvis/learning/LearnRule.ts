import { Observable, Observer } from 'rxjs';

import Interpreter from './../parser/Interpreter';
import Rule, {ProcessRule, ProcessResult} from '../parser/Rule';
import Dialog from '../interface/Dialog';
import Process from '../system/Process';
import * as Maybe from '../func/Maybe';
import {ExecDefinition} from '../jobs/ExecJob';
import Store from '../storage/Store';

import Program from './program/Program';
import ExecRule from './rules/ExecRule';
import {DefinitionResult} from './DefinitionRule';

class LearnRule extends ProcessRule {
	private _interpreter: Interpreter<DefinitionResult>;

	constructor(private _dialog: Dialog, private _store: Store) {
		super(
			/^\s*learn (?:'(.+?)'|"(.+?)"|([a-z].+)$)/,
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
				(program: Program, action) => {
					program.steps.push(action);
					return program;
				},
				{
					name: taskName,
					steps: [],
					recoverySteps: []
				}
			).map(program => {
				const commandList = program.steps.map((c, i) => ` #${i + 1} - ${JSON.stringify(c)}`).join('\n');
				this._dialog.say(`You defined ${taskName} as:\n${commandList}`);
				return program;
			}).flatMap(program => {
				return Process.fromPromise(this.store(program));
			});

		return {
			asynchronous: false,
			progress: progress
		};
	}

	captureAction(observer: Observer<ExecDefinition>, first: boolean): Promise<ExecDefinition> {
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

	requestDefinition(): Observable<ExecDefinition> {
		return Observable.create(observer => {
			this.captureAction(observer, true);
		});
	}

	store(program: Program): Promise<any> {
		return this._store.add('programs', program.name, program);
	}
}

export default LearnRule;