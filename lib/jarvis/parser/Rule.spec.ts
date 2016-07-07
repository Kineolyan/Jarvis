import Rule from './Rule';
import _ from 'lodash';

describe('Jarvis::Parse::Rule', function () {
  describe('#match', function () {
    beforeEach(function () {
      this.rule = new Rule(/^ab*$/, _.noop);
    });

    it('returns true if the message matches', function () {
      expect(this.rule.match('abb')).to.be.true;
    });

    it('returns flase if the message does not match the expr', function () {
      expect(this.rule.match('cdd')).to.be.false;
    });
  });

  describe('#execute', function() {
    beforeEach(function () {
      this.list = [];
      this.rule = new Rule(/a(b*)/, values => this.list.push(values));
      this.rule.execute('abbc');
    });

    it('executes the callback', function () {
      expect(this.list).to.have.length(1);
    });

    it('captures elements from the regexp', function () {
      const args = _.first(this.list);
      expect(args[1]).to.eql('bb');
    });

    it('returns the result of the proc', function() {
      const result = this.rule.execute('a');
      expect(result).to.eql(this.list.length);
    });
  });
});
