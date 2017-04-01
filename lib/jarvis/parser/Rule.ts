import {Observable} from 'rxjs';
import {ProcessMsg} from '../system/Process';

export interface RuleResult {
  asynchronous: boolean,
  progress?: Observable<ProcessMsg>,
  description?: string
}

export interface RuleAction {
  (value: any): RuleResult
}

export class Rule {
  constructor(private _expr: RegExp, private _action: RuleAction) {}

  match(message: string) {
    return this._expr.test(message);
  }

  execute(message: string): RuleResult {
    const matches = this._expr.exec(message);
    return this._action(matches);
  }
}

export default Rule;
