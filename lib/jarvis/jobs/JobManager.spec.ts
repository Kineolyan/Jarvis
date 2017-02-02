import {expect} from 'chai';
const _ = require('lodash');

import JobManager from './JobManager';
import { MockIO } from '../interface/IOs';
import Dialog from '../interface/Dialog';

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
    let job: Promise<any>;
    let resolver;

    beforeEach(function () {
      job = mgr.registerJob(new Promise(r => { resolver = r; }));
    });

    it('assigns an id to the job', function () {
      const ids = Array.from((<any> mgr)._jobs.keys());
      expect(ids).to.eql([1]);
    });

    it('logs the job completion', function () {
      resolver(1);
      return job.then(() => {
        expect(io.out).to.eql(['[Jarvis]>> Task 1 completed\n']);
      });
    });

    it('deregisters the job after completion', function () {
      resolver(1);
      return job.then(() => {
        expect((<any> mgr)._jobs.get(1)).to.be.undefined;
      });
    });
  });

  describe('#printJobs', () => {
		it('prints an empty list of tasks', function() {
      mgr.printJobs();
			expect(io.out).to.have.length(1);

      const message = io.out[0].trim().split('\n');
      expect(message).to.have.length(2, 'Wrong message length');

			expect(message[0]).to.match(/Jobs at \d{1,2}h\d{1,2}/);
      expect(message[1]).to.contain('-- No jobs registered');
		});

		it('prints all active tasks', function() {
			_.times(2, i => mgr.registerJob(new Promise(resolve => {})));
      mgr.printJobs();

			expect(io.out).to.have.length(1);

      const message = io.out[0].trim().split('\n');
      expect(message).to.have.length(3, 'Wrong message length');

			expect(message[0]).to.match(/Jobs at \d{1,2}h\d{1,2}/);
      for (const jobLine of message.slice(1)) {
        expect(jobLine).to.match(/ \* #\d+ \(since \d{1,2}h\d{1,2}\)/);
      }
		});

		it('prints the job description if any', function() {
			_.times(2, i => mgr.registerJob(new Promise(resolve => {}), 'my action'));
      mgr.printJobs();

			expect(io.out).to.have.length(1);

      const message = io.out[0].trim().split('\n');
      expect(message).to.have.length(3, 'Wrong message length');

			expect(message[0]).to.match(/Jobs at \d{1,2}h\d{1,2}/);
      expect(message[1]).to.match(/ \* my action \(since \d{1,2}h\d{1,2}\)/);
		});

		it('evolves after task completions', function() {
      let resolver;
      const job = mgr.registerJob(new Promise(r => { resolver = r; }));
      mgr.printJobs();
      resolver();
      return job.then(() => {
        mgr.printJobs();

        // Filter on the expected output as we may have other
        const jobsList = io.out.filter(output => /Jobs at/.test(output));

        expect(jobsList[0]).not.to.contain('No jobs registered');
        expect(jobsList[1]).to.contain('No jobs registered');
      });
		});
  });
});
