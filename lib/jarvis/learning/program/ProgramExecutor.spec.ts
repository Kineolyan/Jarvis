import {expect} from 'chai';
import * as fs from 'fs';
import {Observable, Scheduler} from 'rxjs';

import {MockIO} from '../../interface/IOs';
import Dialog from '../../interface/Dialog';
import JobManager from '../../jobs/JobManager';
import {isOutput, isCompletion, ProcessMsg, ProcessCompletion} from '../../system/Process';

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
          .map((msg: ProcessMsg) => {
            if (isOutput(msg) && msg.source === 'err' && /Step 1 .* failed/.test(msg.data)) {
              const expr = /Resume execution (\d+) to continue./;
              expect(msg.data).to.match(expr);

              const executionId: number = parseInt(expr.exec(msg.data)[1], 10);
              expect(executionMgr.has(executionId)).to.eql(true, `No execution with id ${executionId}`);
              console.log('coucou', msg);

            // //   return Observable.create((observer) => {
            // //     fs.writeFile(SOME_FILE, 'something', writeErr => {
            // //       if (writeErr) {
            // //         observer.error(writeErr);
            // //       } else {
            // //         executionMgr.resume(executionId);
            // //         observer.next(msg);
            // //         observer.complete();
            // //       }
            // //     });
            // //   });
              fs.writeFileSync(SOME_FILE, 'something');
              console.log('execMgr', executionMgr);
              // executionMgr.resume(executionId);
            }
            return msg;
          })
          .reduce((aggregates, message) => [...aggregates, message], [])
          .toPromise()
          .then(messages => {
            const result = messages.pop();
            expect(isCompletion(result)).to.eql(true, 'Last message of completion type');
            expect((result as ProcessCompletion).code).to.eql(0);

            const data: string[] = [];
            for (const msg of messages) {
              if (isOutput(msg)) {
                data.push(msg.data);
              }
            }
            expect(data).to.have.length(4);
            expect(data[0]).to.match(/Step 0 .* success/);
            expect(data[1]).to.match(/Step 1 .* failed/);
            expect(data[2]).to.match(/Step 1 .* success/);
            expect(data[3]).to.match(/Step 2 .* success/);
          });
      });
    });
  });

});