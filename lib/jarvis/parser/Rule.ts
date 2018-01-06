import {Observable} from 'rxjs';
import Process, {ProcessMsg} from '../system/Process';

interface RuleAction<Result> {
  (value: any): Result
}

class Rule<Result> {
  constructor(public _expr: RegExp, public _action: RuleAction<Result>) {}

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

class RuleTransformer<T, U> extends Rule<U> {
  constructor(private rule: Rule<T>, private transformer: (r: T) => U) {
    super(rule._expr, args => this.transform(args));
  }

  private transform(args) {
    const result = this.rule._action(args);
    return this.transformer(result);
  }

  describe() {
    return this.rule.describe();
  }
}

interface ProcessResult {
  asynchronous: boolean,
  progress?: Observable<ProcessMsg>,
  description?: string
}
class ProcessRule extends Rule<ProcessResult> {}
const syncSuccess = {
  asynchronous: false,
  progress: Process.success()
};

export default Rule;
export {
  RuleTransformer,
  RuleAction,
  ProcessResult,
  ProcessRule,
  syncSuccess
};
