import {Observable} from 'rxjs';
import {ProcessMsg} from '../system/Process';

interface RuleAction<Result> {
  (value: any): Result
}

class Rule<Result> {
  constructor(protected _expr: RegExp, private _action: RuleAction<Result>) {}

  match(message: string) {
    return this._expr.test(message);
  }

  execute(message: string): Result {
    const matches = this._expr.exec(message);
    return this._action(matches);
  }

  describe(): string {
    return `${this.constructor.name}: ${this._expr.toString()}`;
  }

  static getQuotedArg(arg: string): string {
    if (arg[0] === '\'' || arg[0] === '"') {
      return arg.substring(1, arg.length - 1);
    } else {
      return arg;
    }
  }
}

interface ProcessResult {
  asynchronous: boolean,
  progress?: Observable<ProcessMsg>,
  description?: string
}
class ProcessRule extends Rule<ProcessResult> {}

export default Rule;
export {
  RuleAction,
  ProcessResult,
  ProcessRule
};
