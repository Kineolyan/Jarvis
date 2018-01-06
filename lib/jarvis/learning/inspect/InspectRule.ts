import { expect } from 'chai';
import {Observable} from 'rxjs';
import * as _ from 'lodash';

import Rule, {ProcessRule, syncSuccess, RuleTransformer} from '../../parser/Rule';
import Store from '../../storage/Store';
import Process from '../../system/Process';
import Dialog from '../../interface/Dialog';
import * as Maybe from '../../func/Maybe';
import JobManager, {JobRecord} from '.././../jobs/JobManager';
import {ProcessMsg} from '../../system/Process';
import ExecJob, {ExecDefinition} from '../../jobs/ExecJob';
import Interpreter from '../../parser/Interpreter';
import {JobsRule, JobLogRule} from '../../parser/jobRules';
import {HelpRule} from '../../parser/defaultRules';

import {Context} from './tools';
import {InspectionResult, LookForRule, CaptureAsRule, PrintContextRule} from './inspectionRules';

class InspectRule extends ProcessRule {

  private _interpreter: Interpreter<InspectionResult>;

	constructor(
      private _dialog: Dialog,
      jobMgr: JobManager) {
		super(
			/^\s*inspect\s*$/,
			args => this.inspect());
		this._interpreter = new Interpreter<InspectionResult>();
		this._interpreter.rules.push(
      new RuleTransformer(
        new HelpRule(_dialog, this._interpreter),
        () => null),
      new JobsRule(jobMgr, null),
      new JobLogRule(jobMgr, _dialog, null),
      new LookForRule(jobMgr, _dialog),
      new CaptureAsRule(jobMgr, _dialog),
      new PrintContextRule(_dialog));
	}

	inspect() {
    this._dialog.say('Inspection module loaded. Ready to work.');
    const progress = this.executeInspectionAction({})
      .then(() => {
        this._dialog.say('Waston is leaving the room. Back to normal mode.');
        return Process.success()
      });

    return {
      asynchronous: false,
      progress: Observable.fromPromise(progress)
    };
  }

  executeInspectionAction(context: Context) {
    return this._dialog.ask('Operation? ')
      .then(async answer => {
        if (answer === 'quit') {
          return;
        }

        const result = this._interpreter.interpret(answer);
        if (Maybe.isDefined(result)) {
          const tranformer = await Maybe.get(result);
          context = tranformer !== null && tranformer(context) || context;
        } else {
          this._dialog.report('Cannot understand the action. Try again');
        }

        return this.executeInspectionAction(context);
      });
  }

}

export default InspectRule;