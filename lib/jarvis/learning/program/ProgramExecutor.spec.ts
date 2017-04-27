import {expect} from 'chai';

import {MockIO} from '../../interface/IOs';
import Dialog from '../../interface/Dialog';
import JobManager from '../../jobs/JobManager';
import {isCompletion, ProcessCompletion} from '../../system/Process';

import ProgramExecutor from './ProgramExecutor';
import Program from './Program';

describe('Jarvis::learning::program::ProgramExecutor', () => {
  let jobMgr: JobManager;
	let io: MockIO;

  beforeEach(() => {
    io = new MockIO();
    jobMgr = new JobManager(new Dialog(io));
  });

  describe('#execute', () => {
    it('runs the program to the end', () => {
      const program: Program = {
        name: "explore",
        steps: [
          {
            "cmd": "ls /"
          },
          {
            "cmd": "ls /home"
          }
        ]
      };
      const executor = new ProgramExecutor(program, jobMgr);
      return executor.execute()
        .toPromise()
        .then(msg => {
          expect(isCompletion(msg)).to.eql(true, 'Completion message');
          const result = msg as ProcessCompletion;
          expect(result.code).to.eql(0);
        });
    });
     
    it.skip('runs the program to the first failure', () => {
      const program: Program = {
        name: "explore",
        steps: [
          {
            "cmd": "ls /"
          },
          {
            "cmd": "ls /casa"
          },
          {
            "cmd": "ls ",
            "cwd": "/Users/oliv/projects/jarvis"
          }
        ]
      };
    });
  });

});