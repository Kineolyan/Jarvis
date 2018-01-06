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

type Entry = {value: any};
type Context = {[key: string]: Entry};
type Transformer = (c: Context) => Context | void;

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

export {
	Context,
	Transformer,
	Match,
	getFlags,
	matchLogs,
	getMatches,
	getCapturedValue,
	pickValue,
	nthValue
};
