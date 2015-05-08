module Jarvis
	module Interface

		class Dialog

			def initialize io
				@io = io
			end

			def say message
				@io.out << "[Jarvis]>> #{message}"
			end

			def report message
				@io.err << "[Jarvis]!! #{message}"
			end

			def ask question
				say question
				@io.gets
			end

		end

	end
end