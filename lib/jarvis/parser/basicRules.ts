import Rule, {RuleAction, RuleResult} from './Rule';
import Dialog from '../interface/Dialog';
import Logger from '../interface/Logger';
import ExecJob from '../jobs/ExecJob';
import WatchJob, {CmdWatchDefinition} from '../jobs/WatchJob';
import Store from '../storage/Store';

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
    };
  }
}

class WatchRule extends Rule {
	constructor(private _dialog: Dialog, private _store: Store, private _logger: Logger) {
		super(
      /^watch (?:'(.+?)'|"(.+?)")/,
      args => this.runJob(args)
    );
	}

  runJob(args): RuleResult {
    const name = args[1];
    const progress = this.resolveDefinition(name)
      .then(watchDefinition => {
        if (watchDefinition !== null) {
          this._dialog.say(`Watching '${name}'`);
          const watch = new WatchJob(watchDefinition, {logger: this._logger});
          return watch.execute()
            .then(() => {  /* Nothing to do, swallow the result*/ })
            .catch(err => {
              this._logger.error(`[${name} error]`, err);
              return Promise.reject(err);
            });
        } else {
          this._dialog.report(`Watch task ${name} does not exist`);
          return <void> null;
        }
      });

    return {
      asynchronous: true,
      progress,
      description: `${name} action watching`
    };
  }

  resolveDefinition(name: string): Promise<CmdWatchDefinition> {
    return this._store.get('watches')
      .then(watches => watches[name])
      .then(watchDef => {
        if (!watchDef) { return null; }
        if (watchDef.job) {
          // Resolve the job definition
          return this._store.get('execs')
            .then(execs => execs[watchDef.job])
            .then(exec => ({
              kind: 'cmd',
              files: watchDef.files,
              cmd: exec
            }));
        } else {
          return watchDef;
        }
      })
      .catch(err => {
        const stack = err.stack ? `\n${err.stack}` : '';
        this._dialog.report(`Error while resolving watch task ${name}: ${err.message}.${stack}`);
        return null;
      });
  }
}

class QuitRule extends Rule {
	constructor(quitAction: RuleAction) {
		super(/^\s*(exit|quit)\s*$/, quitAction);
	}
}

export {
	RunRule,
  WatchRule,
	QuitRule
};
