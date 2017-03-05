const _ = require('lodash');
import {expect} from 'chai';

import Rule from './Rule';
import Interpreter from './Interpreter';
import Dialog from '../interface/Dialog';
import { MockIO } from '../interface/IOs';

describe('Jarvis::Parser::Interpreter', function () {
  beforeEach(function () {
    this.interpreter = new Interpreter();
  });

  describe('#constructor', function () {
    it('has no default rule', function () {
      expect(this.interpreter.rules).to.be.empty;
    });
  });

  describe('#interpret', function () {
    beforeEach(function () {
      this.list = [];
      ['a', 'b', 'ab?'].forEach((pattern, i) => {
        this.interpreter.rules.push(new Rule(
          new RegExp(pattern), () => {
            this.list.push(pattern);
            return {
              asynchronous: i % 2 === 0,
              progress: Promise.resolve()
            };
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
        expect(this.result.asynchronous).to.eql(false);
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
        expect(this.result).to.equal(null);
      });
    });

    describe('with many matching rules', function () {
      beforeEach(function () {
        return this.interpreter.interpret('a').progress;
      });

      it('executes the first matching rule', function () {
        expect(this.list).to.eql(['a']);
      });
    });
  });

});
