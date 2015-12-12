require "spec_helper"
require "jarvis/parser/rule"
require "jarvis/parser/interpreter"

RSpec.describe Jarvis::Parser::Interpreter do

  describe '#initialize' do
    let(:interpreter) { Jarvis::Parser::Interpreter.new }

    it 'has no default rule' do
      expect(interpreter.rules).to be_empty
    end
  end

  describe '#interpret' do
    let(:interpreter) { Jarvis::Parser::Interpreter.new }
    let(:list) { [] }
    before do
      interpreter.rules << Jarvis::Parser::Rule.new(/a/, ->(*) { list << 'a' })
      interpreter.rules << Jarvis::Parser::Rule.new(/b/, ->(*) { list << 'b' })
      interpreter.rules << Jarvis::Parser::Rule.new(/ab/, ->(*) { list << 'ab' })
    end

    describe 'on a unique match' do
      before { @result = interpreter.interpret 'b' }

      it 'executes the matching rule' do
        expect(list).to eq ['b']
      end

      it 'returns true since at least one rule matches' do
        expect(@result).to eq true
      end
    end

    describe 'without matching rules' do
      before { @result = interpreter.interpret 'c' }

      it 'executed no rules' do
        expect(list).to be_empty
      end

      it 'returns false' do
        expect(@result).to eq false
      end
    end

    describe 'with many matching rules' do
      before { @result = interpreter.interpret 'a' }

      it 'executed the first matching rule' do
        expect(list).to eq ['a']
      end

      it 'returns true' do
        expect(@result).to eq true
      end
    end
  end

end
