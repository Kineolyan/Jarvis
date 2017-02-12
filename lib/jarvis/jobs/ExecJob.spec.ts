const _ = require('lodash');
import {expect} from 'chai';

import ExecJob from './ExecJob';
import {setStore, buildTestStore} from '../storage/Store';

setStore(buildTestStore(mapping => {
  const execs = mapping.get('execs');
  execs.add('test', { cmd: 'echo test' });
}));

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
    let tasks;
    beforeEach(function () {
      return ExecJob.tasks()
        .then(t => { tasks = t });
    });

    it('reads the tasks from the storage', function () {
      expect(_.keys(tasks)).to.include('test');
    });

    // TODO test the structure
  })

  describe('::create', function () {
    it('returns a job if the task exists', function () {
      return ExecJob.create('test').then(job => {
        expect(job).to.be.an.instanceof(ExecJob);
      });
    });

    it('returns undefined if the task does not exist', function () {
      return ExecJob.create('none').then(job => {
        expect(job).to.be.undefined;
      });
    });
  });
});
