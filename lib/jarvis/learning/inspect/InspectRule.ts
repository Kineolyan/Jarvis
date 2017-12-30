import {Observable} from 'rxjs';
import * as _ from 'lodash';

import Rule, {ProcessRule, syncSuccess} from '../../parser/Rule';
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

type InspectionResult = any;
abstract class InspectionRule extends Rule<InspectionResult> {};

type Context = {[key: string]: any};

class InspectRule extends ProcessRule {

  private _interpreter: Interpreter<InspectionResult>;

	constructor(
      private _dialog: Dialog,
      jobMgr: JobManager) {
		super(
			/^\s*inspect\s*$/,
			args => this.inspect()
		);
		this._interpreter = new Interpreter<InspectionResult>();
		this._interpreter.rules.push(
      new HelpRule(_dialog, this._interpreter, null),
      new JobsRule(jobMgr, null),
      new JobLogRule(jobMgr, _dialog, null),
      new LookForRule(jobMgr, _dialog));
	}

	inspect() {
    this._dialog.say('Inspection module loaded. Ready to work.');
    const progress = this.executeInspectionAction()
      .then(() => Process.success());

    return {
      asynchronous: false,
      progress
    };
  }
  
  executeInspectionAction() {
    return this._dialog.ask('Operation? ')
      .then(answer => {
        if (answer === 'quit') {
          return;
        }

        const result = this._interpreter.interpret(answer);
        if (Maybe.isDefined(result)) {
          // TODO, use the result
        } else {
          this._dialog.report('Cannot understand the action. Try again');
        }
        return this.executeInspectionAction();
      });
  }

}

const getFlags: (value: string | undefined) => string = (value) => {
  if (value) {
    return value.includes('g') ? value : `g${value}`;
  } else {
    return 'g';
  }
}

const matchLogs = (job, pattern, userFlags) => {
  const flags = getFlags(userFlags);
  const matches: string[][] = [];
  job.logs.forEach((line) => {
    const expr = new RegExp(pattern, flags);
    let match: RegExpExecArray | null;
    while ((match = expr.exec(line)) !== null) {
      matches.push(match.slice(0, match.length));
    } 
  });

  return matches;
};

class LookForRule extends InspectionRule {

  constructor(
    private _jobMgr: JobManager, 
    private _dialog: Dialog) {
    super(
      /\s*look for \/(.+)\/(\w*) in job (\d+)$/,
      args => this.showLogs(args));
  }

  showLogs(args) {
    const jobId = parseInt(args[3], 10);
    const job = this._jobMgr.getJob(jobId);
    if (job !== undefined) {
      const pattern = args[1];
      const matches = matchLogs(job, pattern, args[2]);
      if (matches.length <= 10) {
        this._dialog.say(`${matches.length} matches for ${pattern}:\n${matches.join('\n')}`);
      } else {
        this._dialog.say(`${matches.length} matches for ${pattern}:\n${matches.slice(0, 10).join('\n')}\n...`);
      }
    } else {
      this._dialog.report(`No jobs with id "${jobId}"`);
    }
  }

}

export default InspectRule;