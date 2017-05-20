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
            "cmd": "ls ."
          }
        ]
      };

      const clearFile = () => new Promise((resolve, reject) => {
        fs.stat(SOME_FILE, (err, s) => {
          if (!err) {
            fs.unlink(SOME_FILE, delErr => {
              delErr ? reject(delErr) : resolve();
            });
          } else if (err.code === 'ENOENT') {
            resolve();
          } else {
            reject(err);
          }
        });
      });

      it.only('runs the program to the first failure', () => {
        const executor = createExecutor(program);
        return clearFile()
          .then(() => {
            return executor.execute()
            .map((msg: ProcessMsg) => {
              if (isOutput(msg) && msg.source === 'err' && /Step 1 .* failed/.test(msg.data)) {
                const expr = /Resume execution (\d+) to continue./;
                expect(msg.data).to.match(expr);

                const executionId: number = parseInt(expr.exec(msg.data)[1], 10);
                expect(executionMgr.has(executionId)).to.eql(true, `No execution with id ${executionId}`);

                fs.writeFileSync(SOME_FILE, 'something');
                executionMgr.resume(executionId);
              }
              return msg;
            })
            .reduce((aggregates, message) => [...aggregates, message], [])
            .toPromise();}
          )
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

            const matches = [
              /Step 0 execution .* job \d+/,
              /Step 0 .* success/,
              /Step 1 execution .* job \d+/,
              /Step 1 .* failed/,
              /Step 1 execution .* job \d+/,
              /Step 1 .* success/,
              /Step 2 execution .* job \d+/,
              /Step 2 .* success/
            ];
            expect(data).to.have.length(matches.length);
            matches.forEach((expr, i) => expect(data[i]).to.match(expr));
          });
      });
    });
  });

});