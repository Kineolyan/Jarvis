require "jarvis/interface/ios"
require "jarvis/interface/dialog"
require "jarvis/parser/interpreter"
require "jarvis/parser/rule"

module Jarvis

  # The main class of the project starting everything
  class Instance
    attr_reader :dialog, :interpreter, :running

  	def initialize io
      @running = false
      @interpreter = Jarvis::Parser::Interpreter.new
  		@dialog = Jarvis::Interface::Dialog.new io

      @interpreter.rules << Jarvis::Parser::Rule.new(/^run (?<quote>['"]?)(?<program>.+)\k<quote>/, ->(matches) do
        @dialog.say "Running '#{matches[:program]}'"
      end)
      @interpreter.rules << Jarvis::Parser::Rule.new(/^quit|exit/, ->(*) { quit })
  	end

    # Start the instance
    def start
      @dialog.say "Hello Sir"

      @running = true
      query_action while @running
    end

    def query_action
      @dialog.say "What to do?"
      result = @interpreter.interpret @dialog.ask ''
      @dialog.say 'Unknown action' unless result
    end

    def quit
      @running = false
      @dialog.say "Good bye Sir"
    end
  end

end
