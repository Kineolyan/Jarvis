require "spec_helper"
require "jarvis/parser/rule"

RSpec.describe Jarvis::Parser::Rule do
  describe '#match' do
    let(:rule) { Jarvis::Parser::Rule.new /^ab*$/, ->() {} }

    it 'returns true if the message matches the expr' do
      expect(rule.match 'abb').to be_truthy
    end

    it 'returns true if the message matches the expr' do
      expect(rule.match 'car').to be_falsy
    end
  end

  describe '#execute' do
    let(:list) { [] }
    let(:rule) { Jarvis::Parser::Rule.new /a(b*)/, ->(*args) { list << args } }

    it 'executes the proc' do
      expect { rule.execute('abbc') }.to change { list.count }.by 1
    end

    it 'captures elements from regexp' do
      rule.execute 'abbc'
      args = list.first.first
      expect(args).to be_an_instance_of MatchData
      expect(args[1]).to eq 'bb'
    end
  end
end
