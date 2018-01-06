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

import {Context, Transformer, matchLogs, getMatches, getCapturedValue} from './tools';

type InspectionResult = null | Promise<Transformer>;
abstract class InspectionRule extends Rule<InspectionResult> {};

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

export {
	InspectionResult,
	InspectionRule,
	LookForRule,
	CaptureAsRule,
	PrintContextRule
};
