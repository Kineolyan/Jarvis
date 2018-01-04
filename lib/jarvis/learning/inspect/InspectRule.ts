import { expect } from 'chai';
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
type Transformer = (c: Context) => Context | void;
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

type Match<T> = {index: string|number, value:T};
function getMatches<T>(matches: T[], dialog: Dialog, askForValues): Promise<Match<T>> {
  if (matches.length === 1) {
    return Promise.resolve({index: 0, value: matches[0]});
  } else {
    return pickValue(
      matches,
      dialog,
      (dialog_, values) => {
        let extract = values.slice(0, 5).map((v, i) => ` [${i}] ${v}`).join('\n');
        if (values.length > 5) {
          const shift = Math.max(5, values.length - 5);
          extract += `\n...\n${values.slice(Math.max(5, values.length)).map((v, i) => ` [${shift + i}] ${v}`).join('\n')}`;
        }
        askForValues(values, dialog_, extract);
      });
  }
}

function getCapturedValue<T>(match: T[], dialog: Dialog, askForMatch): Promise<Match<T>> {
  if (match.length <= 2) {
    // len = 1 -> sequence matched by expr
    // len = 2 -> single captured group
    const index = match.length - 1;
    const value = match[index];
    return Promise.resolve({index, value});
  } else {
    const choices = match.map((m, i) => ` [${i}] ${m}`).join('/n');
    return pickValue(match, dialog, askForMatch(match, dialog, choices));
  }
}

async function pickValue<T>(
    values: T[],
    dialog: Dialog,
    displayValues: (d: Dialog, v: T[]) => void): Promise<Match<T>> {
  displayValues(dialog, values);
  const idx = await dialog.ask('Select occurrence? [first|last|<n>|-<n>] ');
  return {index: idx, value: nthValue(values, idx)};
}

function nthValue<T>(values: T[], idx: string|number) {
  if (idx === 'first') {
    return values[0];
  } else if (idx === 'last') {
    return values[values.length - 1];
  } else {
    const i = parseInt(idx as string, 10);
    return values[i < 0 ? values.length + i : i];
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
      const flags = args[2];
      const matches = matchLogs(job, pattern, flags);
      return getMatches(
          matches,
          this._dialog,
          (values, dialog, extract) => dialog.say(`${values.length} matches for ${pattern}:\n${extract}`))
        .then(async ({index, value: match}) => {
          const result = await getCapturedValue(
            match,
            this._dialog,
            (values, dialog, choices) => dialog(`Select match to use:\n${choices}`));

          return {
            query: {pattern, flags},
            matchIdx: index,
            valueIdx: result.index,
            value: result.value
          }
        })
        .then(result => context => {
          context[args[4]] = result;
          return context;
        });
    } else {
      this._dialog.report(`No jobs with id "${jobId}"`);
      return null;
    }
  }

}

class PrintContextRule extends InspectionRule {

  constructor(dialog: Dialog) {
    super(
      /(?:print|show)(?: me)?(?: the)? context( values)?/,
      args => this.printContext(args, dialog));
  }

  printContext(args, dialog: Dialog) {
    const showValuesOnly = args[1] !== undefined;
    return Promise.resolve(context => {
      const outputContext = showValuesOnly
        ? _.mapValues(context, v => v.value)
        : context;
      dialog.say(`Context:\n${JSON.stringify(outputContext)}`);
    });
  }
}

export default InspectRule;