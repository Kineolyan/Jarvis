import Rule, {RuleAction, RuleResult} from './Rule';
import Dialog from '../interface/Dialog';
import Logger from '../interface/Logger';
import ExecJob from '../jobs/ExecJob';

class RunRule extends Rule {
	constructor(private _dialog: Dialog, private _logger: Logger) {
		super(
      /^run (?:'(.+?)'|"(.+?)")/,
      args => this.runJob(args)
    );
	}

  runJob(args: any): RuleResult {
    const name = args[1];
    const progress = ExecJob.create(name)
      .then(job => {
        if (job !== undefined) {
          this._dialog.say(`Running '${name}'`);
          return job.execute()
            .then(out => {
              this._logger.log(`['${name} output]`, out);
            })
            .catch(err => {
              this._logger.error(`[${name} error]`, err);
              return Promise.reject(err);
            });
        } else {
          this._dialog.report(`Task ${name} does not exist`);
        }
      });

    return {
      asynchronous: true,
      progress,
      description: `${name} action running`

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