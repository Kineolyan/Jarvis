import { Observable, Observer } from 'rxjs';

import Interpreter from './../parser/Interpreter';
import Rule, {ProcessRule, ProcessResult, RuleTransformer} from '../parser/Rule';
import Dialog from '../interface/Dialog';
import Process from '../system/Process';
import * as Maybe from '../func/Maybe';
import {ExecDefinition} from '../jobs/ExecJob';
import Store from '../storage/Store';
import {HelpRule} from '../parser/defaultRules';

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
		this._interpreter.rules.push(
			new RuleTransformer(
				new HelpRule(_dialog, this._interpreter),
				() => ({})),
			new ExecRule(this._dialog));
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

	requestDefinition(): Observable<ExecDefinition> {
		return Observable.create(async observer => {
			let first = true;
			try {
				for (
						let action = await this._dialog.ask('What to do first? ');
						!/\s*done\s*/.test(action);
						action = await this._dialog.ask('What to do then? ')) {
					const result = this._interpreter.interpret(action);
					const operation = Maybe.doOrElse(result, r => r.progress || null, undefined);
					if (operation) {
						const actionResult = await operation;
						observer.next(actionResult);
					} else if (operation === undefined) {
						this._dialog.report('Cannot understand the action. Try again');
					} // else null => non-defining operation
				}
				observer.complete();
			} catch (err) {
				observer.error(err)
			}
		});
	}

	store(program: Program): Promise<any> {
		return this._store.add('programs', program.name, program);
	}
}

export default LearnRule;