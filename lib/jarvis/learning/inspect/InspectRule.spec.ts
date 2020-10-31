import {expect} from 'chai';
import {Observable, Scheduler} from 'rxjs';
import * as _ from 'lodash';

import {MockIO} from '../../interface/IOs';
import Dialog from '../../interface/Dialog';
import {InterpreterChecker} from '../../parser/Interpreter';
import JobManager from '../../jobs/JobManager';

import InspectRule from './InspectRule';

describe('Jarvis::learning::inspect::InspectRule', () => {
	let rule: InspectRule;
  let io: MockIO;
  let jobMgr: JobManager;

	beforeEach(() => {
		io = new MockIO(false);
    const dialog = new Dialog(io);
    jobMgr = new JobManager(dialog);
		rule = new InspectRule(dialog, jobMgr);
	});

  it('has correct rules matching', () => {
    new InterpreterChecker().fromInstance((<any>rule)._interpreter)
			.addMatches('HelpRule',
				'help',
        'help me')
      .addMatches('JobsRule',
        'show jobs',
        'list jobs')
      .addMatches('JobLogRule',
        'show logs for job 132')
      .addMatches('LookForRule',
        'look for /asdf/ in job 39',
        'look for /as(\\w)*?$/ in job 39',
        'look for /asdf/gi in job 39')
      .addMatches('CaptureAsRule',
        'capture /asdf/ in job 39 as var',
        'capture /as(\\w)*?$/ in job 39 as var',
        'capture /asdf/gi in job 39 as var',
        'capture /asdf/ in job 39 as var-with_strange-CHARS')
      .addMatches('PrintContextRule',
        'show me context',
        'print the context',
        'print context values')
      .runTests();
  });

  it('runs a full inspection', async () => {
    const jobId = jobMgr.registerJob(
      Observable.of(
        {data: '1.1 first line\n1.2 second line', source: 'out'},
        {data: '2.1 third line', source: 'out'},
        {data: '3.1 last line', source: 'out'},
        {code: 0},
        Scheduler.asap));
    await jobMgr.getJob(jobId).completion;

    io.input(
      'show jobs',
      `show logs for job ${jobId}`,
      `look for /\\w+ line/ in job ${jobId}`,
      `capture /\\w+ line/ in job ${jobId} as line-nb`);
    const nbResponse = io.prepareInput();
    io.input(
      `capture /(\\w+) line/i in job ${jobId} as cnt`,
      '-3',
      'show context values',
      'show context',
      'quit');

    const result = rule.execute('inspect');
    nbResponse('last');
    const res = await result.progress.toPromise()
      .then(() => true);
    expect(res).to.eq(true);
    const l = io.out.length
    const nbMatch = {
      query: {pattern: "\\w+ line", flags: ''},
      matchIdx: 'last',
      valueIdx: 0,
      value: 'last line'
    };
    const cntMatch = {
      query: {pattern: "(\\w+) line", flags: 'i'},
      matchIdx: '-3',
      valueIdx: 1,
      value: 'second'
    };
    expect(io.out[l - 3])
    .to.match(new RegExp(`"line-nb":"${_.escapeRegExp(nbMatch.value)}"`))
    .to.match(new RegExp(`"cnt":"${_.escapeRegExp(cntMatch.value)}"`));
    expect(io.out[l - 2])
      .to.match(new RegExp(`"line-nb":${_.escapeRegExp(JSON.stringify(nbMatch))}`))
      .to.match(new RegExp(`"cnt":${_.escapeRegExp(JSON.stringify(cntMatch))}`));
    expect(io.out[l - 1]).to.match(/back to normal/i);
  });
});