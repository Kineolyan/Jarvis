import Rule from 'jarvis/parser/Rule';
import Interpreter from 'jarvis/parser/Interpreter';
import Dialog from 'jarvis/interface/Dialog';
import JobManager from 'jarvis/jobs/JobManager';
import { MockIO } from 'jarvis/interface/IOs';

import _ from 'lodash';

describe('Jarvis::Parser::Interpreter', function () {
  beforeEach(function () {
    this.io = new MockIO();
    this.jobMgr = new JobManager(new Dialog(this.io));
    this.interpreter = new Interpreter(this.jobMgr);
  });

  describe('#constructor', function () {
    it('has no default rule', function () {
      expect(this.interpreter.rules).to.be.empty;
    });
  });

  describe('#interpret', function () {
    beforeEach(function () {
      this.list = [];
      ['a', 'b', 'ab?'].forEach(pattern => {
        this.interpreter.rules.push(new Rule(
          new RegExp(pattern), () => {
            this.list.push(pattern);
            return pattern;
        }));
      });
    });

    describe('on a unique match', function () {
      beforeEach(function () {
        this.result = this.interpreter.interpret('b');
      });

      it('executes the matching rule', function () {
        expect(this.list).to.eql(['b']);
      });

      it('returns true since at least one rule matches', function () {
        expect(this.result).to.eql('b');
      });
    });

    describe('without matching rules', function () {
      beforeEach(function () {
        this.result = this.interpreter.interpret('c');
      });

      it('executes no rules', function () {
        expect(this.list).to.be.empty;
      });

      it('returns false', function () {
        expect(this.result).to.be.false;
      });
    });

    describe('with many matching rules', function () {
      beforeEach(function () {
        this.result = this.interpreter.interpret('a');
      });

      it('executes the first matching rule', function () {
        expect(this.list).to.eql(['a']);
      });

      it('returns true', function () {
        expect(this.result).to.eql('a');
      });
    });

    describe('with Promise', function() {
      beforeEach(function () {
        this.interpreter.rules.push(new Rule(
          /^exec/, () => new Promise(r => { this.resolver = r })
        ));
        this.result = this.interpreter.interpret('execute');
      });

      it('register the job in progress', function () {
        const jobIds = this.jobMgr.jobs;
        expect(jobIds).to.have.length(1);
      });

      it('returns the promise with job extension', function (done) {
        expect(this.result).to.be.an.instanceof(Promise);
        this.result
          .then(() => {
            expect(_.last(this.io.out)).to.match(/Task \d+ completed/);
            expect(this.jobMgr.jobs).to.be.empty;
            done();
          });
        this.resolver(1);
      })
    });
  });

});
