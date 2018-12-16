import { Observable, from} from 'rxjs';
import {flatMap} from 'rxjs/operators';

import {RuleAction, ProcessRule, ProcessResult} from './Rule';
import Dialog from '../interface/Dialog';
import Logger from '../interface/Logger';
import ExecJob from '../jobs/ExecJob';
import WatchJob, {CmdWatchDefinition} from '../jobs/WatchJob';
import Store from '../storage/Store';
import Process from '../system/Process';

class RunRule extends ProcessRule {
	constructor(private _dialog: Dialog, private _logger: Logger) {
		super(
      /^run ('.+?'|".+?"|.+$)/,
      args => this.runJob(args)
    );
	}

  runJob(args: any): ProcessResult {
    const name = ProcessRule.getQuotedArg(args[1]);
    const progress = from(ExecJob.create(name))
      .pipe(flatMap(job => {
        if (job !== undefined) {
          this._dialog.say(`Running '${name}'`);
          return job.execute();
        } else {
          this._dialog.report(`Task ${name} does not exist`);
          return Process.error();
        }
      }));

    return {
      asynchronous: true,
      progress,
      description: `${name} action`
    };
  }
}

class WatchRule extends ProcessRule {
	constructor(private _dialog: Dialog, private _store: Store, private _logger: Logger) {
		super(
      /^watch ('[^']+'|"[^"]+")\s*$/,
      args => this.runJob(args)
    );
	}

  runJob(args): ProcessResult {
    const name = ProcessRule.getQuotedArg(args[1]);
    const progress = from(this.resolveDefinition(name))
      .pipe(flatMap(watchDefinition => {
        if (watchDefinition !== null) {
          this._dialog.say(`Watching '${name}'`);
          const watch = new WatchJob(watchDefinition, {}, this._dialog);
          return watch.execute();
        } else {
          this._dialog.report(`Watch task ${name} does not exist`);
          return Process.error();
        }
      }));

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

class DynamicWatchRule extends ProcessRule {
	constructor(private _dialog: Dialog, private _logger: Logger) {
		super(
      /^watch ('.+?'|".+?"|[^ ]+) and do (?:('.+'|".+")(?: in ('.+'|".+"|.+$))?|(.+$))/,
      args => this.startWatching(args)
    );
	}

  startWatching(args): ProcessResult {
    const definition = this.getDefinition(args);
    const watch = new WatchJob(definition, {}, this._dialog);
    const progress = watch.execute();

    return {
      asynchronous: true,
      progress,
      description: `watching ${definition.files} and doing ${definition.cmd.cmd}`
    };
  }

  getDefinition(args): CmdWatchDefinition {
    const directory = ProcessRule.getQuotedArg(args[1]);
    let cmd, cwd;
    if (args[4]) {
      const parts = args[4].split(/\s*in\s*/);
      cmd = parts[0];
      cwd = this.getCommandPath(parts[1]);
    } else {
      cmd = ProcessRule.getQuotedArg(args[2]);
      cwd = this.getCommandPath(args[3]);
    }

    return {
      files: directory,
      cmd: {cmd, cwd}
    };
  }

  private getCommandPath(value?: string): string {
    return value ? ProcessRule.getQuotedArg(value) : process.cwd();
  }
}

class QuitRule extends ProcessRule {
	constructor(quitAction: RuleAction<ProcessResult>) {
		super(/^\s*(exit|quit)\s*$/, quitAction);
	}
}

export {
	RunRule,
  WatchRule,
  DynamicWatchRule,
	QuitRule
};
