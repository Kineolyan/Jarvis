import ExecJob from 'jarvis/jobs/ExecJob';
import store from 'jarvis/storage/Store';

import _ from 'lodash';

store.forTests();

describe('Jarvis::Jobs::ExecJob', function () {
  describe('#execute', function () {
    it('executes the command in shell', function () {
      this.job = new ExecJob({ cmd: 'echo "bash"' });
      return this.job.execute().then(out => {
        expect(out).to.eql('bash\n');
      });
    });

    it('executes the job with CWD', function () {
      this.job = new ExecJob({ cmd: 'pwd', cwd: '/home' });
      return this.job.execute().then(out => {
        expect(out).to.eql('/home\n');
      });
    });

    it('fails with error content', function () {
      this.job = new ExecJob({ cmd: 'ls /a/b/c' });
      return this.job.execute().catch(error => {
        expect(error).to.match(new RegExp('/a/b/c'));
      });
    })
  });

  describe('::tasks', function () {
    beforeEach(function () {
      this.tasks = ExecJob.tasks();
    });

    it('reads the tasks from the storage', function () {
      expect(_.keys(this.tasks)).to.include('test');
    });

    // TODO test the structure
  })

  describe('::create', function () {
    it('returns a job if the task exists', function () {
      const job = ExecJob.create('test');
      expect(job).to.be.an.instanceof(ExecJob);
    });

    it('returns undefined if the task does not exist', function () {
      const job = ExecJob.create('none');
      expect(job).to.be.undefined;
    });
  });
});
