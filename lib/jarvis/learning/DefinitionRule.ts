import Rule from '../parser/Rule';
import { ExecDefinition } from './../jobs/ExecJob';

interface DefinitionResult {
  progress?: Promise<ExecDefinition>,
  description?: string
}
class DefinitionRule extends Rule<DefinitionResult> {}

export {
	DefinitionResult,
	DefinitionRule
}