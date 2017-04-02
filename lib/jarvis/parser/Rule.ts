import {Observable} from 'rxjs';
import {ProcessMsg} from '../system/Process';

interface RuleAction<Result> {
  (value: any): Result
}

class Rule<Result> {
  constructor(private _expr: RegExp, private _action: RuleAction<Result>) {}

  match(message: string) {
    return this._expr.test(message);
  }

  execute(message: string): Result {
    const matches = this._expr.exec(message);
    return this._action(matches);
  }
}

interface ProcessResult {
  asynchronous: boolean,
  progress?: Observable<ProcessMsg>,
  description?: string
}
class ProcessRule extends Rule<ProcessResult> {}


type DefinitionResult = {
  progress: Promise<string>,
  description?: string
}
class DefinitionRule extends Rule<DefinitionResult> {}

export default Rule;
export {
  RuleAction,
  ProcessResult,
  ProcessRule,
  DefinitionResult,
  DefinitionRule
};
