require "spec_helper"
require "jarvis/interface/dialog"
require "jarvis/interface/ios"

RSpec.describe Jarvis::Interface::Dialog do
	let(:io) { Jarvis::Interface::StringIO.new }
	let(:dialog) { Jarvis::Interface::Dialog.new io }

	describe "#say" do
		before { dialog.say "Hello Sir" }

		it "outputs the message prefix by Jarvis" do
			expect(io.out.content.last).to eq "[Jarvis]>> Hello Sir\n"
		end

		it "prints nothing on error" do
			expect(io.err.content).to be_empty
		end
	end

	describe "#report" do
		before { dialog.report "Ough" }

		it "outputs the error prefix by Jarvis" do
			expect(io.err.content.last).to eq "[Jarvis]!! Ough\n"
		end

		it "prints nothing on output" do
			expect(io.out.content).to be_empty
		end
	end

	describe '#ask' do
		before do
			2.times { |i| io.input << "Say #{i + 1}" }
			@response = dialog.ask 'What to do?'
		end

		it 'outputs the question' do
			expect(io.out.content.last).to eq "[Jarvis]>> What to do? "
		end

		it 'gets the user input' do
			expect(@response).to eq 'Say 1'
		end
	end
end
