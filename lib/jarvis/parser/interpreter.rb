module Jarvis::Parser

  class Interpreter
    attr_accessor :rules

    def initialize
      @rules = []
    end

    def interpret message
      @rules.each do |rule|
        if rule.match message
          return if rule.execute message
        end
      end
    end
  end

end
