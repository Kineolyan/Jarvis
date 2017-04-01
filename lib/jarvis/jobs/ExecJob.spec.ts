import * as _ from 'lodash';
import {expect} from 'chai';

import ExecJob from './ExecJob';
import {setStore, buildTestStore} from '../storage/Store';
import {Process, isOutput, isCompletion} from '../system/Process';

setStore(buildTestStore(mapping => {
  const execs = mapping.get('execs');
  if (execs) {
    execs.add('test', { cmd: 'echo test' });
  } else {
    throw new Error('execs mapping not configued yet');
  }
}));

function reduceToPromise(process: Process): Promise<{output: string, code: number}> {
  return process
    .reduce(
      (result, msg) => {
        if (isOutput(msg)) {
          result.output += msg.data.toString();
        } else if (isCompletion(msg)) {
          result.code = msg.code
        }

        return result;
      },
      {output: '', code: -1}
    )
    .toPromise();
}

describe('Jarvis::Jobs::ExecJob', () => {
  describe('#execute', () => {
    it('executes the command in shell', () => {
      const job = new ExecJob({ cmd: 'echo "bash"' });
      return reduceToPromise(job.execute())
        .then(result => {
          expect(result.output).to.eql('bash\n');
          expect(result.code).to.eql(0);
        });
    });

    it('executes the job with CWD', () => {
      const job = new ExecJob({ cmd: 'pwd', cwd: '/home' });
      return reduceToPromise(job.execute())
        .then(result => {
          expect(result.output).to.eql('/home\n');
          expect(result.code).to.eql(0);
        })
    });

    it('fails with error content', () => {
      const job = new ExecJob({ cmd: 'ls /a/b/c' });
      return reduceToPromise(job.execute())
        .then(result => {
          expect(result.code).not.to.eql(0);
          expect(result.output).to.match(new RegExp('/a/b/c'));
        });
    })
  });

  describe('::tasks', () => {
    let tasks;
    beforeEach(() => {
      return ExecJob.tasks()
        .then(t => { tasks = t });
    });

    it('reads the tasks from the storage', () => {
      expect(_.keys(tasks)).to.include('test');
    });

    // TODO test the structure
  })

  describe('::create', () => {
    it('returns a job if the task exists', () => {
      return ExecJob.create('test').then(job => {
        expect(job).to.be.an.instanceof(ExecJob);
      });
    });

    it('returns undefined if the task does not exist', () => {
      return ExecJob.create('none').then(job => {
        expect(job).to.be.undefined;
      });
    });
  });
});
