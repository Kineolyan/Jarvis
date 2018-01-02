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

type Context = {[key: string]: any};
type Transformer = (c: Context) => Context;
type InspectionResult = null | Promise<Transformer>;
abstract class InspectionRule extends Rule<InspectionResult> {};


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
      new LookForRule(jobMgr, _dialog),
      new CaptureAsRule(jobMgr, _dialog));
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
      progress
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
          context = tranformer !== null
            ? tranformer(context)
            : context;
        } else {
          this._dialog.report('Cannot understand the action. Try again');
        }

        return this.executeInspectionAction(context);
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
    return null;
  }

}

function getMatches(matches, dialog, askForValues) {
  if (matches.length === 1) {
    return Promise.resolve(matches[0]);
  } else {
    return pickValue(
      matches,
      dialog,
      (dialog, values) => {
        let extract = values.slice(0, 5).join('\n');
        if (values.length > 5) {
          extract += `\n...\n${values.slice(Math.max(5, values.length)).join('\n')}`;
        }
        askForValues(dialog, values, extract);
      });
  }
}

function getCapturedValue(match, dialog, askForMatch) {
  if (match.length === 1) {
    return Promise.resolve(match[0]); // Matched sequence
  } else if (match.length === 2) {
    return Promise.resolve(match[1]); // Single captured group
  } else {
    const choices = match.map((m, i) => ` [${i}] ${m}`).join('/n');
    return pickValue(match, dialog, askForMatch(match, dialog, choices));
  }
}

async function pickValue<T>(
    values: T[],
    dialog: Dialog,
    displayValues: (d: Dialog, v: T[]) => void): Promise<T> {
  displayValues(dialog, values);
  const idx = await dialog.ask('Select occurence? [first|last|<n>] ');
  return nthValue(values, idx);
}

function nthValue<T>(values: T[], idx: number|string) {
  if (idx === 'first') {
    return values[0];
  } else if (idx === 'last') {
    return values[values.length - 1];
  } else {
    return values[idx];
  }
}

class CaptureAsRule extends InspectionRule {

  constructor(
    private _jobMgr: JobManager,
    private _dialog: Dialog) {
    super(
      /\s*capture \/(.+)\/(\w*) in job (\d+) as ([\w\-_]+)$/,
      args => this.captureValue(args));
  }

  captureValue(args) {
    const jobId = parseInt(args[3], 10);
    const job = this._jobMgr.getJob(jobId);
    if (job !== undefined) {
      const pattern = args[1];
      const matches = matchLogs(job, pattern, args[2]);
      return getMatches(
          matches,
          this._dialog,
          (values, dialog, extract) => dialog.say(`${values.length} matches for ${pattern}:\n${extract}`))
        .then(match => getCapturedValue(
          match,
          this._dialog,
          (values, dialog, choices) => dialog(`Select match to use:\n${choices}`)))
        .then(value => context => {
          context[args[4]] = value;
          return context;
        });
    } else {
      this._dialog.report(`No jobs with id "${jobId}"`);
      return null;
    }
  }

}

export default InspectRule;