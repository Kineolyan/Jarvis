export class Rule {
  constructor(expr, action) {
    this._expr = expr;
    this._action = action;
  }

  match(message) {
    return this._expr.test(message);
  }

  execute(message) {
    const matches = this._expr.exec(message);
    const result = this._action(matches);
    return result === undefined ? true : result;
  }
}

export default Rule;
