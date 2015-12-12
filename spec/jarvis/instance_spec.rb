require "spec_helper"

RSpec.describe Jarvis::Instance do
  let(:io) { Jarvis::Interface::StringIO.new }
  let(:jarvis) { Jarvis::Instance.new io }

  describe '#initialize' do
    it 'is not running' do
      expect(jarvis.running).to be false
    end
  end

  describe '#query_action' do
    it 'asks to do something' do
      jarvis.query_action
      expect(io.out.content.first).to eq "[Jarvis]>> What to do?\n"
    end

    it 'interprets the answer' do
      io.input << 'exit'
      jarvis.query_action
      expect(io.input).to be_empty
    end

    it 'notifies if it cannot interpret' do
      io.input << 'hello world'
      jarvis.query_action
      expect(io.out.content.last).to eq "[Jarvis]>> Unknown action\n"
    end
  end

  describe '#start' do
    let(:check) { { count: 0 } }
    before do
      jarvis.interpreter.rules << Jarvis::Parser::Rule.new(/(\d)/, ->(*) do
        check[:count] += 1
        check[:running] = true
      end)
      io.input << '1' << '2' << 'nothing' << 'quit'

      jarvis.start
    end

    it 'flags as running' do
      expect(check[:running]).to be true
    end

    it 'first great the user' do
      expect(io.out.content.first).to eq "[Jarvis]>> Hello Sir\n"
    end

    it 'asks to do something' do
      expect(io.out.content[1]).to eq "[Jarvis]>> What to do?\n"
    end

    it 'calls repeatedly for actions' do
      expect(io.input).to be_empty
    end

    it 'executes matching actions' do
      expect(check[:count]).to eq 2
    end

    it 'ends when executing "quit" or "exit"' do
      # Nothing to do, we should have exit the loop
      expect(jarvis.running).to eq false
    end
  end

  describe 'default configuration' do
    it 'has a rule to run programs' do
      io.input << 'run jarvis'
      jarvis.query_action
      expect(io.out.content.last).to eq "[Jarvis]>> Running 'jarvis'\n"
    end

    it 'has a rule to quit Jarvis' do
      io.input << 'exit'
      jarvis.query_action
      expect(io.out.content.last).to eq "[Jarvis]>> Good bye Sir\n"
    end

    ['exit', 'quit'].each do |action|
      it "exits program on #{action}" do
        io.input << action
        jarvis.query_action
        expect(io.out.content.last).to match /good bye/i
      end
    end
  end

end
