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

class DoLearningRule extends ProcessRule {

	constructor(
			private _dialog: Dialog,
			private _store: Store,
			private _jobMgr: JobManager) {
		super(
			/do (?:'(.+?)'|"(.+?)"|(.+?)$)/,
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

	findProgram(name): Promise<Maybe.Type<Program>> {
		return this._store.get('programs')
			.then(programs => {
				const def = programs[name];
				return def ? Maybe.just(def) : Maybe.none();
			})
	}

	executeProgram(name: string, program: Maybe.Type<Program>): Observable<ProcessMsg> {
		if (Maybe.isDefined(program)) {
			const executor = new ProgramExecutor(program, this._jobMgr);
			return Observable.fromPromise(executor.execute());
		} else {
			this._dialog.report(`Program ${name} does not exist`);
			return Observable.of({
				code: 1
			});
		}
	}

}

export default DoLearningRule;