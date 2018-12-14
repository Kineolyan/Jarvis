const _ = require('lodash');
import {expect} from 'chai';

import Rule from './Rule';

describe('Jarvis::Parse::Rule', function () {
  describe('#match', function () {
    let rule: Rule<any>;

    beforeEach(function () {
      rule = new Rule(/^ab*$/, _.noop);
    });

    it('returns true if the message matches', function () {
      expect(rule.match('abb')).to.be.true;
    });

    it('returns flase if the message does not match the expr', function () {
      expect(rule.match('cdd')).to.be.false;
    });
  });

  describe('#execute', function() {
    let list: any[];
    let rule: Rule<number>;

    beforeEach(function () {
      list = [];
      rule = new Rule(/a(b*)/, values => list.push(values));
      rule.execute('abbc');
    });

    it('executes the callback', function () {
      expect(list).to.have.length(1);
    });

    it('captures elements from the regexp', function () {
      const args = _.first(list);
      expect(args[1]).to.eql('bb');
    });

    it('returns the result of the proc', function() {
      const result = rule.execute('a');
      expect(result).to.eql(list.length);
    });
  });
});
