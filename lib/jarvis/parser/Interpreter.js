export class Interpreter {
  constructor(jobManager) {
    this._rules = [];
    this._jobManager = jobManager;
  }

  get rules() {
    return this._rules;
  }

  interpret(message) {
    for (let rule of this._rules) {
      if (rule.match(message)) {
        const result = rule.execute(message);
        if(result !== undefined && result instanceof Promise) {
          this._jobManager.registerJob(result);
        }

        return result;
      }
    }

    return false;
  }
}

export default Interpreter;
