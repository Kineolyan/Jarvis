import {expect} from 'chai';
import * as _ from 'lodash';
import {Observable, Subject} from 'rxjs';

import JobManager, {JobRecord} from './JobManager';
import { MockIO } from '../interface/IOs';
import Dialog from '../interface/Dialog';
import {ProcessMsg} from '../system/Process';

describe('Jarvis::Jobs::JobManager', function () {
  let io: MockIO;
  let mgr: JobManager;

  beforeEach(function () {
    io = new MockIO();
    mgr = new JobManager(new Dialog(io));
  });

  describe('#constructor', function () {
    it('starts without jobs', function () {
      expect(mgr.jobs).to.be.empty;
    });
  });

  describe('#registerJob', function () {
    let subject: Subject<ProcessMsg>;
    let jobId: number;

    beforeEach(function () {
      subject = new Subject<ProcessMsg>();
      jobId = mgr.registerJob(subject);
    });

    it('assigns an id to the job', function () {
      const ids = Array.from((<any> mgr)._jobs.keys());
      expect(ids).to.eql([jobId]);
    });

    it('logs the job completion', function () {
      const job = mgr.getJob(jobId);

      subject.next({code: 0});
      subject.complete();

      return job.completion.then(() => {
        expect(io.out).to.eql([`[Jarvis]>> Task ${jobId} completed\n`]);
      });
    });

    it('returns the job on completion', function () {
      const job = mgr.getJob(jobId);

      subject.complete();

      return job.completion.then(record => {
        expect(record).to.equal(job);
      });
    });

    it('keeps the job after completion', function () {
      const job = mgr.getJob(jobId);
      subject.complete();

      return job.completion.then(() => {
        expect(mgr.getJob(jobId)).not.to.be.undefined;
      });
    });
  });

  describe('#printJobs', () => {
    const neverEndingObservable = Observable.create(subcriber => {});

		it('prints an empty list of tasks', function() {
      mgr.printJobs();
			expect(io.out).to.have.length(1);

      const message = io.out[0].trim().split('\n');
      expect(message).to.have.length(2, 'Wrong message length');

			expect(message[0]).to.match(/Jobs at \d{1,2}h\d{1,2}/);
      expect(message[1]).to.contain('-- No jobs registered');
		});

		it('prints all active tasks', function() {
			_.times(2, i => mgr.registerJob(neverEndingObservable));
      mgr.printJobs();

			expect(io.out).to.have.length(1);

      const message = io.out[0].trim().split('\n');
      expect(message).to.have.length(3, 'Wrong message length');

			expect(message[0]).to.match(/Jobs at \d{1,2}h\d{1,2}/);
      for (const jobLine of message.slice(1)) {
        expect(jobLine).to.match(/ \* #\d+: .+ \(since \d{1,2}h\d{1,2}\)/);
      }
		});

		it('prints the job description if any', function() {
			mgr.registerJob(neverEndingObservable, 'my action');
      mgr.printJobs();

			expect(io.out).to.have.length(1);

      const message = io.out[0].trim().split('\n');
      expect(message).to.have.length(2, 'Wrong message length');

			expect(message[0]).to.match(/Jobs at \d{1,2}h\d{1,2}/);
      expect(message[1]).to.match(/ \* #\d+: my action \(since \d{1,2}h\d{1,2}\)/);
		});

		it('prints only details without description if any', function() {
			mgr.registerJob(neverEndingObservable);
      mgr.printJobs();

			expect(io.out).to.have.length(1);

      const message = io.out[0].trim().split('\n');
      expect(message).to.have.length(2, 'Wrong message length');

			expect(message[0]).to.match(/Jobs at \d{1,2}h\d{1,2}/);
      expect(message[1]).to.match(/ \* #\d+: \<unknown\> \(since \d{1,2}h\d{1,2}\)/);
		});

		it('evolves after task completions', function() {
      const subject = new Subject<ProcessMsg>();
      const jobId = mgr.registerJob(subject);
      const job: JobRecord = mgr.getJob(jobId);
      mgr.printJobs();

      subject.next({code: 0});
      subject.complete();

      return job.completion.then(() => {
        mgr.printJobs();

        // Filter on the expected output as we may have other
        const jobsList = io.out.filter(output => /Jobs at/.test(output));

        expect(jobsList[0]).not.to.contain('No jobs registered');
        expect(jobsList[1]).to.contain('No jobs registered');
      });
		});
  });
});
