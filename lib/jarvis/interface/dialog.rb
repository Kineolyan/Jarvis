module Jarvis
	module Interface

		# Facade providing methods to enable dialogs between a user and the IA.
		# This acts from the point of view of the IA
		class Dialog
			# Constructor
			# Params:
			# - io: IO to use to communicate with the user
			def initialize io
				@io = io
			end

			# Says something to the user
			# Params:
			# - message: message to say to the user
			def say message
				@io.out << "[Jarvis]>> #{message}"
			end

			# Reports an error to the user
			# Params:
			# - message: error message to report
			def report message
				@io.err << "[Jarvis]!! #{message}"
			end

			# Asks a question to the user
			# This blocks until the user replies
			# Params:
			# - question: content of the question
			# Returns;
			# - The user response
			def ask question
				@io.out.print("[Jarvis]>> #{question} ")
				@io.gets
			end
		end

	end
end
