module Jarvis
	module Interface

		class StdIO
			class Out
				def initialize output
					@output = output
				end

				def << message
					@output.puts message
				end
			end

			attr_reader :out, :err

			def initialize
				@out = Out.new STDOUT
				@err = Out.new STDERR
			end

			def gets
				STDOUT.gets.chomp
			end
		end

		class StringIO
			class Out
				attr_reader :content

				def initialize
					@content = ""
				end

				def << value
					@content << value << "\n"
				end
			end

			attr_reader :out, :err, :input

			def initialize
				@out = Out.new
				@err = Out.new
				@input = []
			end

			def gets
				@input.shift
			end
		end

	end
end