import { Observable } from 'rxjs';

import Rule, {RuleAction, ProcessRule, ProcessResult} from './Rule';
import Dialog from '../interface/Dialog';
import Process from '../system/Process';
import Interpreter from './Interpreter';

class HelpRule<T> extends Rule<T> {
	constructor(
    private _dialog: Dialog, 
    private _interpreter: Interpreter<any>,
    private _returnValue: T) {
		super(
      /^\s*help(?: +me)?\s*$/,
      args => this.printHelp()
    );
  }
  
  describe() {
    return `${this._expr} -> Print this help`
  }

  printHelp() {
    const rules = this._interpreter.rules
      .map(rule => `  ${rule.describe()}`);
    this._dialog.say(`Help:\n${rules.join('\n')}\n`);

    return this._returnValue;
  }
}

class QuestionRule extends ProcessRule {
	constructor(private _dialog: Dialog) {
		super(
      /^\s*(?:show me|list me) pending questions\s*$/,
      args => this.listQuestions()
    );
	}

  listQuestions(): ProcessResult {
    const questions = this._dialog.getPendingQuestions();
    let progress;
    if (questions.length > 0) {
      const listing = `Pending questions:\n${questions
        .map(q => ` [${q.id}] `)
        .join('\n')
      }\nSelect your question? `;
      progress = Process.fromPromise(
        this._dialog.ask(listing)
          .then(answer => {
            const questionId = answer 
              ? parseInt(answer, 10)
              : questions[0].id;
            return this._dialog.askAgain(questionId);
          }));
    } else {
      this._dialog.say('No pending questions');
      progress = Process.success();
    }

    return {
      asynchronous: false,
      progress: progress,
      description: `Answering pending questions`
    };
  }
}

export {
  QuestionRule,
  HelpRule
}