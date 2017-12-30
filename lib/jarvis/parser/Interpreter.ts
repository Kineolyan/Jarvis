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
  interpret(message: string): Maybe.Option<Result> {
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

  registerRule(rule: Rule<any>, ruleName: string): RuleRegistry;
}

class InterpreterChecker {
  private _rules: Map<string, {rule: Rule<any>, matches: string[]}>;
  private _traps: string[];

  constructor() {
    this._rules = new Map();
    this._traps = [];
  }

  fromInstance(interpreter: Interpreter<any>): InterpreterChecker {
    for (const rule of interpreter.rules) {
      const ruleName = rule.constructor.name;
      if (!this._rules.has(ruleName)) {
        this._rules.set(ruleName, {rule, matches: []});
      } else {
        throw new Error(`Two rules of the same class ${ruleName} make it impossible to generate checker automatically.`);
      }
    }

    return this;
  }

  addMatches(ruleName, ...matches): InterpreterChecker {
    const rule = this._rules.get(ruleName);
    if (rule) {
      rule.matches.push(...matches);
    } else {
      throw new Error(`Rule ${ruleName} does not exist. Try one of ${Array.from(this._rules.keys())}`)
    }
    return this;
  }

  /**
   * Adds multiples inputs that should not match any rule.
   * @param traps inputs meant to trick matchers
   * @return this
   */
  addTraps(...traps): InterpreterChecker {
    this._traps.push(...traps);
    return this;
  }

  registerRule(rule: Rule<any>, ruleName: string): RuleRegistry {
    this._rules.set(ruleName, {rule, matches: []});
    return {
      addMatches: this.addMatches.bind(this, ruleName),
      registerRule: this.registerRule.bind(this)
    };
  }

  runTests(): void {
    // Check first the input, for every rule must have defined matches
    const missingMatches: string[] = [];
    for (const [name, {matches}] of this._rules.entries()) {
      if (matches.length === 0) {
        missingMatches.push(name);
      }
    }
    if (missingMatches.length > 0) {
      throw new Error(`Some rules have no matches. Give at least one to for the following: ${missingMatches}`);
    }

    const mismatches: Map<string, string[]> = new Map();
    const overlaps: Map<string, Set<string>> = new Map();
    const traps: Map<string, string[]> = new Map();
    for (const [name, {rule, matches}] of this._rules.entries()) {
      matches.reduce(
        (result, input) => {
          if (!rule.match(input)) {
            let failure = result.get(name);
            if (failure) {
              failure.push(input);
            } else {
              result.set(name, [input]);
            }
          }

          return result;
        },
        mismatches
      );

      this._traps.reduce(
        (result, input) => {
          if (rule.match(input)) {
            let failure = result.get(input);
            if (failure) {
              failure.push(name);
            } else {
              result.set(input, [name]);
            }
          }

          return result;
        },
        traps
      );

      for (const [otherName, {rule: otherRule}] of this._rules.entries()) {
        if (otherName !== name) {
          matches.reduce(
            (result, input) => {
              if (otherRule.match(input)) {
                let failure = result.get(input);
                if (failure) {
                  failure.add(otherName);
                } else {
                  result.set(input, new Set([name, otherName]));
                }
              }

              return result;
            },
            overlaps
          );
        }
      }
    }

    if (mismatches.size > 0 || overlaps.size > 0 || traps.size > 0) {
      let message = 'Test results:\n';

      if (mismatches.size > 0) {
        message += `-- Rules not matching with their inputs:\n`;
        for (const [name, unmatches] of mismatches.entries()) {
          message += ` :$ ${name}\n`;
          unmatches.forEach(input => message += `   - ${input}\n`);
        }
      }

      if (overlaps.size > 0) {
        message += `-- Overlapping rules matching the same inputs:\n`;
        for (const [input, rules] of overlaps.entries()) {
          message += ` :X ${input}\n`;
          rules.forEach(rule => message += `   - ${rule}\n`);
        }
      }

      if (traps.size > 0) {
        message += `-- Traps not avoided:\n`;
        for (const [input, rules] of traps.entries()) {
          message += ` :( ${input}\n`;
          rules.forEach(rule => message += `   - ${rule}\n`);
        }
      }

      throw new Error(message);
    }
  }
}

export default Interpreter;
export {
  InterpreterChecker
}
