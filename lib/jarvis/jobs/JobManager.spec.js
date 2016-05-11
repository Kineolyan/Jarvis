import JobManager from 'jarvis/jobs/JobManager';
import { MockIO } from 'jarvis/interface/IOs';
import Dialog from 'jarvis/interface/Dialog';

describe('Jarvis::Jobs::JobManager', function () {
  beforeEach(function () {
    this.io = new MockIO();
    this.mgr = new JobManager(new Dialog(this.io));
  });

  describe('#constructor', function () {
    it('starts without jobs', function () {
      expect(this.mgr.jobs).to.be.empty;
    });
  });

  describe('#registerJob', function () {
    beforeEach(function () {
      this.job = this.mgr.registerJob(new Promise(r => { this.resolver = r; }));
    });

    it('assigns an id to the job', function () {
      const ids = Array.from(this.mgr._jobs.keys());
      expect(ids).to.eql([1]);
    });

    it('logs the job completion', function () {
      this.resolver(1);
      return this.job.then(() => {
        expect(this.io.out).to.eql(['[Jarvis]>> Task 1 completed\n']);
      });
    });

    it('deregisters the job after completion', function () {
      this.resolver(1);
      return this.job.then(() => {
        expect(this.mgr._jobs.get(1)).to.be.undefined;
      });
    });
  });
});
