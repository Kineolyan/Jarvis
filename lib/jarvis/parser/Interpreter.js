export class Interpreter {
  constructor() {
    this._rules = [];
  }

  get rules() {
    return this._rules;
  }

  interpret(message) {
    for (let rule of this._rules) {
      if (rule.match(message)) {
        return rule.execute(message);
      }
    }

    return false;
  }
}

export default Interpreter;
