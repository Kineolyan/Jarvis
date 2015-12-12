module Jarvis
	module Interface

		# Representation of a StdIO
		# This contains methods to output content in the IO and reads inputs
		class StdIO
			# Class instanciating an Out stream
			class Out
				def initialize output
					@output = output
				end

				def << message
					@output.puts message
					self
				end

				def print message
					@output.print message
					self
				end
			end

			attr_reader :out, :err

			def initialize
				@out = Out.new STDOUT
				@err = Out.new STDERR
			end

			def gets
				STDIN.gets.chomp
			end
		end

		# IO working with strings.
		# This is mainly interesting for tests.
		class StringIO
			# Class instanciating an Out stream
			class Out
				attr_reader :content

				def initialize
					@content = []
				end

				def << value
					@content << "#{value}\n"
				end

				def print value
					if @content.last == nil || @content.last.end_with?("\n")
						@content << ''
					end
					@content.last << value
					self
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
