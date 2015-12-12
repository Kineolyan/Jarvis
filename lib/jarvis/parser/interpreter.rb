module Jarvis::Parser

  class Interpreter
    attr_accessor :rules

    def initialize
      @rules = []
    end

    def interpret message
      result = @rules.each do |rule|
        if rule.match message
          return true if rule.execute message
        end
      end
      result == false
    end
  end

end
