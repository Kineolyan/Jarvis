const _ = require('lodash');
import {expect} from 'chai';

import Instance from './Instance';
import { MockIO } from './interface/IOs';
import { JobManager } from './jobs/JobManager';
import Rule from './parser/Rule';
import {getStore, setStore, buildTestStore} from './storage/Store';

describe('Jarvis::Instance', function () {
  let io: MockIO;
  let instance: Instance;

  beforeEach(function () {
    setStore(buildTestStore());

    io = new MockIO();
    instance = new Instance(io, 'Celia');
    // Silent logger
    (<any> instance)._logger = {log: _.noop, error: _.noop};
  });

  describe('#constructor', function () {
    it('is not running', function () {
      expect(instance.running).to.be.false;
    });
  });

  describe('#queryAction', function () {
    it('asks to do something', function () {
      io.input('not important');
      instance.queryAction();
      expect(io.out).to.eql(['[Celia]>> What to do?\n']);
    });

    it('interprets the answer', function () {
      io.input('exit');
      return instance.queryAction().then(() => {
        expect(io.inputs).to.be.empty;
      });
    });

    it('notifies if it cannot interpret', function () {
      io.input('hello world');
      return instance.queryAction().then(() => {
        expect(io.err).to.eql(['[Celia]!! Unknown action\n']);
      });
    });

    describe('with Promise returned by command', function() {
      let jobMgr: JobManager;

      beforeEach(function () {
        jobMgr = (<any> instance)._jobMgr;
        (<any> instance)._interpreter.rules.push(new Rule(
          /^exec/, () => ({
            asynchronous: true,
            progress: new Promise<void>(r => { this.resolver = r })
          })
        ));
        io.input('execute');

        return instance.queryAction();
      });

      it('register the job in progress', function () {
        const jobIds = jobMgr.jobs;
        expect(jobIds).to.have.length(1);
      });

      it('returns the promise with job extension', function () {
        const record = jobMgr.jobs[0];
        this.resolver(1);
        return record.job
          .then(() => {
            expect(_.last(io.out)).to.match(/Task \d+ completed/);
            expect(jobMgr.jobs).to.be.empty;
          });
      })
    });
  });

  describe('#start', function () {
    describe('on scenario', function() {
      beforeEach(function () {
        this.count = 0;
        (<any> instance)._interpreter.rules.push(new Rule(
          /(\d)/, () => {
            this.count += 1;
            return { asynchronous: false };
          }
        ));
        io.input('1', '2', 'nothing', 'quit');
        return instance.start();
      });

      it.skip('flags as running', function () {
        expect(this.count).to.be.above(0);
      });

      it('first great the user', function () {
        expect(io.out[0]).to.eql('[Celia]>> Hello Sir\n');
      });

      it('asks to do something', function () {
        expect(io.out[1]).to.eql('[Celia]>> What to do?\n');
      });

      it('calls repeatedly for actions', function () {
        expect(io.inputs).to.be.empty;
      });

      it('executes matching actions', function () {
        expect(this.count).to.eql(2);
      });

      it('ends when executing "quit" or "exit"', function () {
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

      const resolvers: Function[] = [];
      (<any> instance)._interpreter.rules.push(new Rule(
        /^exec/, () => {
          const progress = new Promise<void>(r => {
            resolvers.push(r);
            if (resolvers.length === 2) {
              resolvers.forEach((resolver, i) => resolver(i));
              lastQuestionResolver('quit'); // Ask to stop instance
            }
          });
          return { asynchronous: true, progress };
        }
      ));

      return instance.start();
    });
  });

  describe('default configuration', function () {
    it('has a rule to run programs', function () {
      io.input('run \'jarvis\'');
      return getStore().add('execs', 'jarvis', { cmd: 'echo jarvis' })
        .then(() => instance.queryAction())
        // Wait for the completion of the asynchronous job
        .then(() => (<JobManager> (<any> instance)._jobMgr).jobs[0].job)
        .then(() => {
          expect(io.out).to.include('[Celia]>> Running \'jarvis\'\n');
        });
    });

    it('has a rule to print jobs', function () {
      io.input('jobs');
      return instance.queryAction().then(() => {
        const jobOutput = io.out.filter(output => /Jobs at /.test(output));
        expect(jobOutput).to.have.length(1, 'No output for jobs.');
      });
    });

    ['quit', 'exit'].forEach(function(action) {
      it(`exits the program on ${action}`, function () {
        io.input(action);
        return instance.queryAction().then(() => {
          expect(instance.running).to.be.false;
          expect(_.last(io.out)).to.eql('[Celia]>> Good bye Sir\n');
        });
      })
    });
  });
});
