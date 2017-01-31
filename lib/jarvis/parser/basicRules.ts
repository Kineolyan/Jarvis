import Rule, {RuleAction, RuleResult} from './Rule';
import Dialog from '../interface/Dialog';
import ExecJob from '../jobs/ExecJob';

class RunRule extends Rule {
	constructor(private _dialog: Dialog, private _logger: any) {
		super(
      /^run (?:'(.+?)'|"(.+?)")/,
      args => {
        const name = args[1];
        const job = ExecJob.create(name);

        if (job !== undefined) {
          this._dialog.say(`Running '${name}'`);
          const progress = job.execute()
            .then(out => {
              this._logger.log(`['${name} output]`, out);
              return out;
            })
            .catch(err => {
              this._logger.error(`[${name} error]`, err);
              return Promise.reject(err);
            });
          return { asynchronous: true, progress };
        } else {
          this._dialog.report(`Task ${name} does not exist`);
          return null;
        }
      }
    );
	}
}

class QuitRule extends Rule {
	constructor(quitAction: RuleAction) {
		super(/^\s*(exit|quit)\s*$/, quitAction);
	}
}

export {
	RunRule,
	QuitRule
};