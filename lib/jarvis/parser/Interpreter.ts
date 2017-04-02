import Rule from './Rule';
import * as Maybe from '../func/Maybe';

export class Interpreter<Result> {
  private _rules: Array<Rule<Result>>;
  constructor() {
    this._rules = [];
  }

  get rules() {
    return this._rules;
  }

  /**
   * Interprets a message from user.
   * @param message - message to Interpreter
   * @return result of the operation, or false if unknown
   */
  interpret(message: string): Maybe.Type<Result> {
    for (let rule of this._rules) {
      if (rule.match(message)) {
        return Maybe.just(rule.execute(message));
      }
    }

    return Maybe.none();
  }
}

export default Interpreter;
