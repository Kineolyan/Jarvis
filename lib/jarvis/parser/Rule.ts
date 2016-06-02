interface RuleAction {
  (value: any): any
}

export class Rule {
  constructor(private _expr: RegExp, private _action: RuleAction) {}

  match(message: string) {
    return this._expr.test(message);
  }

  execute(message: string) {
    const matches = this._expr.exec(message);
    const result = this._action(matches);
    return result === undefined ? true : result;
  }
}

export default Rule;
