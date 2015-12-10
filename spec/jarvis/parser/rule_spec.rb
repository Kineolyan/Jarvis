require "spec_helper"
require "jarvis/parser/rule"

RSpec.describe Jarvis::Parser::Rule do
  describe '#match' do
    let(:rule) { Jarvis::Parser::Rule.new(/^ab*$/) {} }

    it 'returns true if the message matches the expr' do
      expect(rule.match 'abb').to be_truthy
    end

    it 'returns true if the message matches the expr' do
      expect(rule.match 'car').to be_falsy
    end
  end
end
