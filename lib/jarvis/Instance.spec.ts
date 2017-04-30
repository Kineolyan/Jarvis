import * as _ from 'lodash';
import {expect} from 'chai';
import {Observable, Observer} from 'rxjs';

import Instance from './Instance';
import { MockIO } from './interface/IOs';
import { JobManager } from './jobs/JobManager';
import Rule from './parser/Rule';
import {getStore, setStore, buildTestStore} from './storage/Store';
import {InterpreterChecker} from './parser/Interpreter';

describe('Jarvis::Instance', () => {
  let io: MockIO;
  let instance: Instance;

  beforeEach(() => {
    setStore(buildTestStore());

    io = new MockIO();
    instance = new Instance(io, 'Celia');
    // Silent logger
    (<any> instance)._logger = {log: _.noop, error: _.noop};
  });

  describe('#constructor', () => {
    it('is not running', () => {
      expect(instance.running).to.be.false;
    });
  });

  describe('#queryAction', () => {
    it('asks to do something', () => {
      io.input('not important');
      instance.queryAction();
      expect(io.out).to.eql(['[Celia]>> What to do?\n']);
    });

    it('interprets the answer', () => {
      io.input('exit');
      return instance.queryAction()
        .toPromise()
        .then(() => {
          expect(io.inputs).to.be.empty;
        });
    });

    it('notifies if it cannot interpret', () => {
      io.input('hello world');
      return instance.queryAction()
        .toPromise()
        .then(() => {
          expect(io.err).to.eql(['[Celia]!! Unknown action\n']);
        });
    });

    describe('when matching an sync rule', () => {
      let jobMgr: JobManager;
      let observer: Observable<any>;
      let result: Observable<{}>;

      beforeEach(() => {
        jobMgr = (<any> instance)._jobMgr;
        observer = Observable.of(42);
        (<any> instance)._interpreter.rules.push(new Rule(
          /^sync/, () => ({
            asynchronous: false,
            progress: observer
          })
        ));
        io.input('sync execution');

        result = instance.queryAction();
      });

      it('returns the rule progress', () => {
        return result.toPromise()
          .then(value => {
            expect(value).to.eql(42);
          });
      });

      it('does not register any job', () => {
        const jobRecords = jobMgr.jobs;
        expect(jobRecords).to.be.empty;
      });
    });

    describe('when matching an async rule', function() {
      let jobMgr: JobManager;
      let observer;

      beforeEach(() => {
        jobMgr = (<any> instance)._jobMgr;
        (<any> instance)._interpreter.rules.push(new Rule(
          /^async/, () => ({
            asynchronous: true,
            progress: Observable.create(o => {
              observer = o;
              return () => {
                observer = null;
              };
            })
          })
        ));
        io.input('async execution');

        return instance.queryAction()
          .toPromise();
      });

      it('register the job in progress', () => {
        const jobRecords = jobMgr.jobs;
        expect(jobRecords).to.have.length(1);
      });
    });

    describe('when matching a direct rule', () => {
      let jobMgr: JobManager;
      let result: Observable<{}>;

      beforeEach(() => {
        jobMgr = (<any> instance)._jobMgr;
        (<any> instance)._interpreter.rules.push(new Rule(
          /direct/, () => ({
            asynchronous: false
          })
        ));
        io.input('direct execution');

        result = instance.queryAction();
      });

      it('returns a empty progress', () => {
        return result.toPromise()
          .then(value => {
            expect(value).to.be.undefined;
          });
      });

      it('does not register any job', () => {
        const jobRecords = jobMgr.jobs;
        expect(jobRecords).to.be.empty;
      });
    });
  });

  describe('#start', () => {
    describe('on scenario', function() {
      let count: number;
      beforeEach(() => {
        count = 0;
        (<any> instance)._interpreter.rules.push(new Rule(
          /(\d)/, () => {
            count += 1;
            return { asynchronous: false };
          }
        ));
        io.input('1', '2', 'nothing', 'quit');
        return instance.start()
          .toPromise();
      });

      it.skip('flags as running', () => {
        expect(count).to.be.above(0);
      });

      it('first great the user', () => {
        expect(io.out[0]).to.eql('[Celia]>> Hello Sir\n');
      });

      it('asks to do something', () => {
        expect(io.out[1]).to.eql('[Celia]>> What to do?\n');
      });

      it('calls repeatedly for actions', () => {
        expect(io.inputs).to.be.empty;
      });

      it('executes matching actions', () => {
        expect(count).to.eql(2);
      });

      it('ends when executing "quit" or "exit"', () => {
        expect(instance.running).to.be.false;
      });
    });

    it('can run multiple tasks in parallel', function() {
      let lastQuestionResolver;
      io.input(
        // Two tasks in parallel
        'execute', 'execute',
        // One last input to resolve
        new Promise(r => { lastQuestionResolver = r; })
      );

      const observers: Observer<any>[] = [];
      (<any> instance)._interpreter.rules.push(new Rule(
        /^exec/, () => {
          const progress = Observable.create(observer => {
            observers.push(observer);
            if (observers.length === 2) {
              observers.forEach((resolver, i) => observer.complete());
              lastQuestionResolver('quit'); // Ask to stop instance
            }
          });
          return { asynchronous: true, progress };
        }
      ));

      return instance.start()
        .toPromise();
    });
  });

  describe('default configuration', () => {
    it('has a rule to run programs', () => {
      io.input('run \'jarvis\'');
      return getStore().add('execs', 'jarvis', { cmd: 'echo jarvis' })
        .then(() => instance.queryAction().toPromise())
        // Wait for the completion of the asynchronous job
        .then(() => (<JobManager> (<any> instance)._jobMgr).jobs[0].completion)
        .then(() => {
          expect(io.out).to.include('[Celia]>> Running \'jarvis\'\n');
        });
    });

    it('has a rule to print jobs', () => {
      io.input('jobs');
      return instance.queryAction()
        .toPromise()
        .then(() => {
          const jobOutput = io.out.filter(output => /Jobs at /.test(output));
          expect(jobOutput).to.have.length(1, 'No output for jobs.');
        });
    });

    ['quit', 'exit'].forEach(function(action) {
      it(`exits the program on ${action}`, () => {
        io.input(action);
        return instance.queryAction()
          .toPromise()
          .then(() => {
            expect(instance.running).to.be.false;
            expect(_.last(io.out)).to.eql('[Celia]>> Good bye Sir\n');
          });
      });
    });
  });

  it('has correct rules matching', () => {
    new InterpreterChecker().fromInstance((<any>instance)._interpreter)
      .addMatches('RunRule',
        'run "jarvis in the space"',
        "run 'summer after spring'",
        'run "learn \'something\'"'
      )
      .addMatches('QuitRule', 'quit', 'exit')
      .addMatches('RecordRule',
        'record "new rule with double quotes"',
        "record 'new rule with single quotes'"
      )
      .addMatches('ClearRule',
        'clear "new rule with double quotes"',
        "clear 'new rule with single quotes'"
      )
      .addMatches('JobsRule', 'jobs')
      .addMatches('JobLogRule',
        'show logs for job 4025',
        'show logs of job 425034'
      )
      .addMatches('WatchRule',
        'watch "this dq"',
        "watch 'that sq'"
      )
      .addMatches('DynamicWatchRule',
        'watch "this path/**/*" and do "echo hello world"',
        'watch \'this path/**/*\' and do \'echo hello world\'',
        "watch 'this path/**/*' and do 'echo hello world' in ~/some/directory",
        'watch /path/from/root/*.json and do the-thing in "/another/path/with spaces"',
        "watch /tmp/jarvis/*.rs and do 'cargo run' in '/another/path/with spaces'"
      )
      .addMatches('LearnRule',
        'learn "something in dq"',
        "learn 'this sq command'",
        'learn what follows',
        'learn how to run these tests'
      )
      .addMatches('DoLearningRule',
        'do that task',
        'do "something"',
        "do 'something else than expected'",
        'do clean "because i care"'
      )
      .addTraps(
        'should not try to learn this',
        'you may be tempted to run "this statement"',
      )
      .runTests();
  });
});
