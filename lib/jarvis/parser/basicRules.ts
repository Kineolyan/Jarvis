import { Observable } from 'rxjs';

import Rule, {RuleAction, RuleResult} from './Rule';
import Dialog from '../interface/Dialog';
import Logger from '../interface/Logger';
import ExecJob from '../jobs/ExecJob';
import WatchJob, {CmdWatchDefinition} from '../jobs/WatchJob';
import Store from '../storage/Store';
import Process from '../system/Process';

class RunRule extends Rule {
	constructor(private _dialog: Dialog, private _logger: Logger) {
		super(
      /^run (?:'(.+?)'|"(.+?)")/,
      args => this.runJob(args)
    );
	}

  runJob(args: any): RuleResult {
    const name = args[1];
    const progress = Observable.fromPromise(ExecJob.create(name))
      .flatMap(job => {
        if (job !== undefined) {
          this._dialog.say(`Running '${name}'`);
          return job.execute();
        } else {
          this._dialog.report(`Task ${name} does not exist`);
          return Process.error();
        }
      });

    return {
      asynchronous: true,
      progress,
      description: `${name} action`
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
    const progress = Observable.fromPromise(this.resolveDefinition(name))
      .flatMap(watchDefinition => {
        if (watchDefinition !== null) {
          this._dialog.say(`Watching '${name}'`);
          const watch = new WatchJob(watchDefinition, {});
          return watch.execute();
        } else {
          this._dialog.report(`Watch task ${name} does not exist`);
          return Process.error();
        }
      });

    return {
      asynchronous: true,
      progress,
      description: `${name} watch`
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
