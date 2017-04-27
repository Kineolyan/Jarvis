const _ = require('lodash');
import {expect} from 'chai';

import Dialog from '../interface/Dialog';
import { MockIO } from '../interface/IOs';
import * as Maybe from '../func/Maybe';

import Rule from './Rule';
import Interpreter from './Interpreter';

describe('Jarvis::Parser::Interpreter', () => {

  describe('#constructor', () => {
    let interpreter: Interpreter<any>;

    beforeEach(() => {
      interpreter = new Interpreter<any>();
    });

    it('has no default rule', () => {
      expect(interpreter.rules).to.be.empty;
    });
  });

  describe('#interpret', () => {
    let interpreter: Interpreter<string>;

    beforeEach(() => {
      interpreter = new Interpreter<string>();
    });
    let list: string[];

    beforeEach(() => {
      list = [];
      ['a', 'b', 'ab?'].forEach((pattern, i) => {
        interpreter.rules.push(new Rule(
          new RegExp(pattern), () => {
            list.push(pattern);
            return pattern;
        }));
      });
    });

    describe('on a unique match', () => {
      let result: Maybe.Type<string>;
      beforeEach(() => {
        result = interpreter.interpret('b');
      });

      it('executes the matching rule', () => {
        expect(list).to.eql(['b']);
      });

      it('returns true since at least one rule matches', () => {
        expect(Maybe.isDefined(result)).to.equal(true, 'Result defined');
        expect(result).to.eql('b');
      });
    });

    describe('without matching rules', () => {
      let result: Maybe.Type<string>;
      beforeEach(() => {
        result = interpreter.interpret('c');
      });

      it('executes no rules', () => {
        expect(list).to.be.empty;
      });

      it('returns false', () => {
        expect(Maybe.isUndefined(result)).to.equal(true, 'No result defined');
      });
    });

    describe('with many matching rules', () => {
      beforeEach(() => {
        interpreter.interpret('a');
      });

      it('executes the first matching rule', () => {
        expect(list).to.eql(['a']);
      });
    });
  });

});
