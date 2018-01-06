import { Observable } from 'rxjs';

import * as Maybe from '../../func/Maybe';
import Dialog from "../../interface/Dialog";
import Rule, {RuleTransformer} from "../../parser/Rule";
import Interpreter from "../../parser/Interpreter";
import ExecRule from "../rules/ExecRule";
import { HelpRule } from "../../parser/defaultRules";
import Process from "../../system/Process";

import { CaptureAsRule, PrintContextRule } from "./inspectionRules";
import { Context } from "./tools";
import { ExecDefinition } from '../../jobs/ExecJob';
import {DefinitionResult} from '../DefinitionRule';

/*
create recovery
show me context
capture /abc/ from job $2 as var // Second job in the program
run 'simon compile --artefacts @var --also-make'
run 'simon test --artefact @var --also-make-deps'
print process
attempt a dry run
end
 */

type Operation = any;
type Payload = {context: Context, process: Operation[]};
type Transformer = (p: Payload) => (void | Promise<Payload>);

const applyTemplate = (value: string | undefined, context: Context = {}) => {
  if (value === undefined) {
    return value;
  }

  // look for every template
  const keys = new Set();
  const expr = /@([\w\-_]+)/g;
  let match;
  while ((match = expr.exec(value)) !== null) {
    keys.add(match[1]);
  }

  let result = value;
  keys.forEach(key => {
    const entry = context[key];
    if (entry !== undefined) {
      result = result.replace(`@{key}`, entry.value);
    }
  });

  return result;
}

class CreateRecoveryRule extends Rule<any> {

	private interpreter: Interpreter<any>;

	constructor(dialog: Dialog, context: any = {}) {
		super(
			/create (manual )?recovery(?: process)?/,
			args => this.createRecovery(dialog, context, args));

		this.interpreter = new Interpreter<Transformer>();
		this.interpreter.rules.push(
			newn RuleTransformer(
        new HelpRule(dialog, this.interpreter),
        (payload) => {}),
      new RuleTransformer(
        new ExecRule(dialog),
        this.addExecution),
			new CaptureAsRule(null, dialog),
			new PrintContextRule(dialog));
	}

	private createRecovery(dialog, context, args) {
    dialog.say('Creating a new rule .');
    const progress = this.loopOnDefinition(dialog, context, {})
      .then((process) => {
				// TODO do something with the process
        dialog.say('Done :)');
        return Process.success()
      });

    return {
      asynchronous: false,
      progress: Observable.fromPromise(progress)
    };
	}

  private loopOnDefinition(dialog: Dialog, context: Context, process: any) {
    return dialog.ask('Operation? ')
      .then(async answer => {
        if (/^(?:quit|end)$/.test(answer)) {
          return process;
        }

        const result = this.interpreter.interpret(answer);
        if (Maybe.isDefined(result)) {
          const tranformer = await Maybe.get(result);
          context = tranformer !== null && tranformer(context) || context;
        } else {
          dialog.report('Cannot understand the action. Try again');
        }

        return this.loopOnDefinition(dialog, context);
      });
  }

  private addExecution(def: DefinitionResult) {
    if (def.progress) {
      return def.progress.then((execution: ExecDefinition) => (payload) => {
        const {context, process} = payload;
        const exec: ExecDefinition = {
          cmd: applyTemplate(execution.cmd, payload.context),
          cwd: applyTemplate(execution.cwd, payload.context)
        };
        payload.process.push(exec);

        return payload;
      });
    } else {
      return Promise.resolve((payload) => {
        // Report error as there is no exec
      });
    }
  }

}