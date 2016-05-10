import Rule from 'jarvis/parser/Rule';
import Interpreter from 'jarvis/parser/Interpreter';

describe('Jarvis::Parser::Interpreter', function () {
  describe('#constructor', function () {
    beforeEach(function () {
      this.interpreter = new Interpreter();
    });

    it('has no default rule', function () {
      expect(this.interpreter.rules).to.be.empty;
    });
  });

  describe('#interpret', function () {
    beforeEach(function () {
      this.interpreter = new Interpreter();
      this.list = [];
      ['a', 'b', 'ab?'].forEach(pattern => {
        this.interpreter.rules.push(new Rule(
          new RegExp(pattern), () => this.list.push(pattern)
        ));
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
        expect(this.result).to.be.true;
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
        expect(this.result).to.be.true;
      });
    });
  });

});
