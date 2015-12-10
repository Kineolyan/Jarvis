module Jarvis::Parser

  class Rule
    def initialize expr, action
      @expr = expr
      @action = action
    end

    def match message
      @expr =~ message
    end

    def execute message
      matches = @expr.match message
      @action.call(matches) || true
    end
  end

end
