require "jarvis/interface/ios"
require "jarvis/interface/dialog"

module Jarvis

  # The main class of the project starting everything
  class Instance
  	def initialize
  		@dialog = Jarvis::Interface::Dialog.new Jarvis::Interface::StdIO.new
  	end

    # Start the instance
    def start
      @dialog.say "Hello Sir"
    end

  end

end
