import {expect} from 'chai';
import * as fs from 'fs';

import {MockIO} from '../../interface/IOs';
import Dialog from '../../interface/Dialog';
import JobManager from '../../jobs/JobManager';
import {isCompletion, ProcessCompletion} from '../../system/Process';

import ProgramExecutor from './ProgramExecutor';
import Program from './Program';
import ExecutionManager from './ExecutionManager';

describe('Jarvis::learning::program::ProgramExecutor', () => {
  let jobMgr: JobManager;
  let executionMgr: ExecutionManager;
  let dialog: Dialog;
	let io: MockIO;

  function createExecutor(program: Program) {
    return new ProgramExecutor(program, jobMgr, executionMgr, dialog);
  }

  beforeEach(() => {
    io = new MockIO();
    dialog = new Dialog(io);
    jobMgr = new JobManager(dialog);
    executionMgr = new ExecutionManager();
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

      const executor = createExecutor(program);
      return executor.execute()
        .toPromise()
        .then(msg => {
          expect(isCompletion(msg)).to.eql(true, 'Completion message');
          const result = msg as ProcessCompletion;
          expect(result.code).to.eql(0);
        });
    });

    describe('with failure', () => {
      const SOME_FILE = '/tmp/casa';
      const program: Program = {
        name: "explore",
        steps: [
          {
            "cmd": "ls /"
          },
          {
            "cmd": `ls ${SOME_FILE}`
          },
          {
            "cmd": "ls ",
            "cwd": "/Users/oliv/projects/jarvis"
          }
        ]
      };

      beforeEach(() => new Promise((reject, resolve) => {
        fs.stat(SOME_FILE, err => {
          if (!err) {
            fs.unlink(SOME_FILE, delErr => {
              delErr ? reject(delErr) : resolve(delErr);
            });
          }
          resolve();
        });
      }));

      it('runs the program to the first failure', () => {
        const executor = createExecutor(program);
        return executor.execute()

      });
    });
  });

});