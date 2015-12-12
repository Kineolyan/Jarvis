ROOT = File.dirname(__FILE__)
$LOAD_PATH.unshift ROOT unless $LOAD_PATH.include? ROOT

require "jarvis/instance"
require "jarvis/interface/ios"
require "jarvis/interface/dialog"
require "jarvis/parser/interpreter"
require "jarvis/parser/rule"
