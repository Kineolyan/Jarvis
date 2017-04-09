import Rule from './Rule';
import * as Maybe from '../func/Maybe';

class Interpreter<Result> {
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

interface RuleRegistry {
  addMatches(...matches: string[]): RuleRegistry;
}

class InterpreterChecker {
  private _rules: Map<string, {rule: Rule<any>, matches: string[]}>;

  constructor() {
    this._rules = new Map();
  }

  registerRule(rule: Rule<any>, ruleName: string): RuleRegistry {
    this._rules.set(name, {rule, matches: []});
    return {
      addMatches(...matches) {
        this._rules.get(name).push(...matches);
        return this;
      }
    };
  }

  runTests(): void {
    const failures: Map<string, {matches: string[], unmatches: string[]}> = new Map();

    for (const [name, {rule, matches}] of this._rules.entries()) {
      matches.reduce(
        (result, input) => {
          if (!rule.match(input)) {
            let failure = result.get(name);
            if (failure) {
              failure.unmatches.push(input);
            } else {
              result.set(name, {matches: [], unmatches: [input]});
            }
          }

          return result;
        },
        failures
      );

      for (const otherEntry of this._rules.entries()) {
        if (otherEntry[0] !== name) {
          const {rule: otherRule, matches} = otherEntry[1];
          matches.reduce(
            (result, input) => {
              if (otherRule.match(input)) {
                let failure = result.get(name);
                if (failure) {
                  failure.matches.push(input);
                } else {
                  result.set(name, {matches: [input], unmatches: []});
                }
              }

              return result;
            },
            failures
          );
        }
      }
    }

    if (failures.size > 0) {
      let message = 'Overlapping rules:\n';
      // TODO continue the message

      throw new Error(message);
    }
  }
}

export default Interpreter;
export {
  InterpreterChecker
}
