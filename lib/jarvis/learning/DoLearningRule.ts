import {Observable} from 'rxjs';
import * as _ from 'lodash';

import {ProcessRule} from '../parser/Rule';
import Store from '../storage/Store';
import Process from '../system/Process';
import Dialog from '../interface/Dialog';
import * as Maybe from '../func/Maybe';
import JobManager, {JobRecord} from './../jobs/JobManager';
import {ProcessMsg} from '../system/Process';
import ExecJob, {ExecDefinition} from '../jobs/ExecJob';

import Program from './program/Program';
import ProgramExecutor from './program/ProgramExecutor';
import RecoveryManager from './recovery/RecoveryManager';
import ExecutionManager from './program/ExecutionManager';

class DoLearningRule extends ProcessRule {

	constructor(
			private _dialog: Dialog,
			private _store: Store,
			private _jobMgr: JobManager,
			private _executionMgr: ExecutionManager,
			private _recoveryMgr: RecoveryManager) {
		super(
			/^\s*do (?:'(.+?)'|"(.+?)"|(.+?)$)/,
			args => this.startProgram(args)
		)
	}

	startProgram(args) {
		const programName = args[1] || args[2] || args[3];
		this._dialog.say(`You reached the task to execute ${programName}`);
		const progress = Observable.fromPromise(this.findProgram(programName))
			.flatMap(program => this.executeProgram(programName, program));

		return {
			asynchronous: true,
			description: `Executing program ${programName}`,
			progress
		};
	}

	findProgram(name): Promise<Maybe.Option<Program>> {
		return this._store.get('programs')
			.then(programs => {
				const def = programs[name];
				return def ? Maybe.just(def) : Maybe.none();
			})
	}

	executeProgram(name: string, program: Maybe.Option<Program>): Observable<ProcessMsg> {
		if (Maybe.isDefined(program)) {
			const executor = new ProgramExecutor(
				Maybe.get(program),
				this._jobMgr,
				this._executionMgr,
				this._recoveryMgr,
				this._dialog
			);
			return executor.execute();
		} else {
			this._dialog.report(`Program ${name} does not exist`);
			return Observable.of({
				code: 1
			});
		}
	}

}

class ShowLearningRule extends ProcessRule {

	constructor(
			private _dialog: Dialog,
			private _store: Store) {
		super(
			/^\s*(?:(?:show|list)(?: me your)?|brag about your) learning$/,
			args => this.showLearning()
		)
	}

	showLearning() {
		const progress = this._store.get('programs')
			.then(programs => {
				const keys = Object.keys(programs);
				this._dialog.say(`I learned:\n${keys.map(k => ` * ${k}`).join('\n')}`);
			});

		return {
			asynchronous: false,
			progress: Process.fromPromise(progress)
		};
	}

}

export default DoLearningRule;
export {
	ShowLearningRule
}