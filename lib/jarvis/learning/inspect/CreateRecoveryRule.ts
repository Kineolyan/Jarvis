import { Observable } from 'rxjs';

import * as Maybe from '../../func/Maybe';
import Dialog from "../../interface/Dialog";
import Rule from "../../parser/Rule";
import Interpreter from "../../parser/Interpreter";
import ExecRule from "../rules/ExecRule";
import { HelpRule } from "../../parser/defaultRules";
import Process from "../../system/Process";

import { CaptureAsRule, PrintContextRule } from "./inspectionRules";
import { Context } from "./tools";

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

class CreateRecoveryRule extends Rule<any> {

	private interpreter: Interpreter<any>;

	constructor(dialog: Dialog, context: any = {}) {
		super(
			/create (manual )?recovery(?: process)?/,
			args => this.createRecovery(dialog, context, args));

		this.interpreter = new Interpreter<any>();
		this.interpreter.rules.push(
			new HelpRule(dialog, this.interpreter, ),
			new ExecRule(dialog),
			new CaptureAsRule(null, dialog),
			new PrintContextRule(dialog));
	}

	private createRecovery(dialog, context, args) {
    dialog.say('Creating a new rule .');
    const progress = this.loopOnDefinition(dialog, context)
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

  private loopOnDefinition(dialog: Dialog, context: Context) {
    return dialog.ask('Operation? ')
      .then(async answer => {
        if (/^(?:quit|end)$/.test(answer)) {
          return null;
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

}