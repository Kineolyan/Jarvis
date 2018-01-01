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
      .then(() => {
        this._dialog.say('Waston is leaving the room. Back to normal mode.');
        return Process.success()
      });

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
      args => this.searchLogs(args));
  }

  searchLogs(args) {
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

function nthValue<T>(values: T[], idx: number|string) {
  if (idx === 'first') {
    return values[0];
  } else if (idx === 'last') {
    ...
  } else {
    ...
  }
}

class CaptureAsRule extends InspectionRule {
  
  constructor(
    private _jobMgr: JobManager, 
    private _dialog: Dialog) {
    super(
      /\s*capture \/(.+)\/(\w*) in job (\d+) as ([\w\-_])$/,
      args => this.captureValue(args));
  }

  captureValue(args) {
    const jobId = parseInt(args[3], 10);
    const job = this._jobMgr.getJob(jobId);
    if (job !== undefined) {
      const pattern = args[1];
      const matches = matchLogs(job, pattern, args[2]);
      if (matches.length === 1) {
        ...
      } else {
        let extract = matches.slice(0, 5).join('\n');
        if (matches.length > 5) {
          extract += `\n...\n${matches.slice(Math.max(5, matches.length)).join('\n')}`;
        }
        this._dialog.say(`${matches.length} matches for ${pattern}:\n${extract}`);
        const idx = await this._dialog.ask('Select occurence? [first|last|<n>] ');
        const match = nthValue(matches, idx);

        const value;
        if (match.length === 1) {
          ... match[0]
        } else if (match.length === 2) {
          ... match[1]
        } else {
          this._dialog.say(`Select the value to use`);
        }

        context[args[4]] = value;
      }
    } else {
      this._dialog.report(`No jobs with id "${jobId}"`);
    }
  }

}

export default InspectRule;