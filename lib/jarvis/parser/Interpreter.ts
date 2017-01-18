import Rule, {RuleResult} from './Rule';

export class Interpreter {
  private _rules: Array<Rule>;
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
  interpret(message: string): RuleResult {
    for (let rule of this._rules) {
      if (rule.match(message)) {
        return rule.execute(message);
      }
    }

    return null;
  }
}

export default Interpreter;
