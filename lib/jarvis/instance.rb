require "jarvis/interface/ios"
require "jarvis/interface/dialog"
require "jarvis/parser/interpreter"
require "jarvis/parser/rule"

module Jarvis

  # The main class of the project starting everything
  class Instance
    attr_reader :dialog

  	def initialize
  		@dialog = Jarvis::Interface::Dialog.new Jarvis::Interface::StdIO.new
      @interpreter = Jarvis::Parser::Interpreter.new

      @interpreter.rules << Jarvis::Parser::Rule.new(/^run (?<quote>['"]?)(?<program>.+)\k<quote>/, ->(matches) do
        @dialog.say "Running '#{matches[:program]}'"
      end)
      @interpreter.rules << Jarvis::Parser::Rule.new(/^quit|exit/, ->(matches) { exit(0) })
  	end

    # Start the instance
    def start
      @dialog.say "Hello Sir"
      while true
        @interpreter.interpret @dialog.ask "What to do?\n"
      end
    end

  end

end
