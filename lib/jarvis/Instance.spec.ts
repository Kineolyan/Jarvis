///<reference path="../../typings/index.d.ts"/>

const _ = require('lodash');
import {expect} from 'chai';

import Instance from './Instance';
import { MockIO } from './interface/IOs';
import Rule from './parser/Rule';

describe('Jarvis::Instance', function () {
  beforeEach(function () {
    this.io = new MockIO();
    this.instance = new Instance(this.io, 'Celia');
    // Silent logger
    this.instance._logger = {log: _.noop, error: _.noop};
  });

  describe('#constructor', function () {
    it('is not running', function () {
      expect(this.instance.running).to.be.false;
    });
  });

  describe('#queryAction', function () {
    it('asks to do something', function () {
      this.io.input('not important');
      this.instance.queryAction();
      expect(this.io.out).to.eql(['[Celia]>> What to do?\n']);
    });

    it('interprets the answer', function () {
      this.io.input('exit');
      return this.instance.queryAction().then(() => {
        expect(this.io.inputs).to.be.empty;
      });
    });

    it('notifies if it cannot interpret', function () {
      this.io.input('hello world');
      return this.instance.queryAction().then(() => {
        expect(this.io.err).to.eql(['[Celia]!! Unknown action\n']);
      });
    });
  });

  describe('#start', function () {
    beforeEach(function () {
      this.count = 0;
      this.instance._interpreter.rules.push(new Rule(
        /(\d)/, () => { this.count += 1 }
      ));
      this.io.input('1', '2', 'nothing', 'quit');
      return this.instance.start();
    });

    it.skip('flags as running', function () {
      expect(this.count).to.be.above(0);
    });

    it('first great the user', function () {
      expect(this.io.out[0]).to.eql('[Celia]>> Hello Sir\n');
    });

    it('asks to do something', function () {
      expect(this.io.out[1]).to.eql('[Celia]>> What to do?\n');
    });

    it('calls repeatedly for actions', function () {
      expect(this.io.inputs).to.be.empty;
    });

    it('executes matching actions', function () {
      expect(this.count).to.eql(2);
    });

    it('ends when executing "quit" or "exit"', function () {
      expect(this.instance.running).to.be.false;
    });
  });

  describe('default configuration', function () {
    it('has a rule to run programs', function () {
      this.io.input('run \'jarvis\'');
      return this.instance.queryAction().then(() => {
        expect(this.io.out).to.include('[Celia]>> Running \'jarvis\'\n');
      });
    });

    ['quit', 'exit'].forEach(function(action) {
      it(`exits the program on ${action}`, function () {
        this.io.input(action);
        return this.instance.queryAction().then(() => {
          expect(this.instance.running).to.be.false;
          expect(_.last(this.io.out)).to.eql('[Celia]>> Good bye Sir\n');
        });
      })
    });
  });
});
