import {EventEmitter} from 'events';
import {Observable, Subject} from 'rxjs';

import Dialog from './interface/Dialog';
import Logger from './interface/Logger';
import Interpreter from './parser/Interpreter';
import {ProcessResult} from './parser/Rule';
import {RunRule, WatchRule, DynamicWatchRule, QuitRule} from './parser/basicRules';
import {RecordRule, ClearRule} from './parser/autoRules';
import LearnRule from './learning/LearnRule';
import DoLearningRule from './learning/DoLearningRule';
import ExecutionManager from './learning/program/ExecutionManager';
import {JobsRule, JobLogRule} from './parser/jobRules';
import JobManager from './jobs/JobManager';
import ExecJob from './jobs/ExecJob';
import Store, {buildDefaultStore, setStore} from './storage/Store'; // FIXME stop using singleton
import { IO } from './interface/IOs';
import * as Maybe from './func/Maybe';

/**
 * The main class of the project starting everything
 */
class Instance extends EventEmitter {
  private _running: boolean;
  private _dialog: Dialog;
  private _jobMgr: JobManager;
  private _interpreter: Interpreter<ProcessResult>;
  private _logger: Logger;
  private _store: Store;
  private _executionMgr: ExecutionManager;
  private _completion: Subject<void>;

  constructor(io: IO, name: string) {
    super();

    this._running = false;
    this._logger = console;
    this._dialog = new Dialog(io);
    if (name !== undefined) {
      this._dialog.name = name;
    }
    this._jobMgr = new JobManager(this._dialog);
    this._store = buildDefaultStore();
    setStore(this._store);
    this._executionMgr = new ExecutionManager();
    this._interpreter = new Interpreter<ProcessResult>();

    this._interpreter.rules.push(new RunRule(this._dialog, this._logger));
    this._interpreter.rules.push(new QuitRule(() => this.quit()));

    this._interpreter.rules.push(new RecordRule(this._dialog, this._store));
    this._interpreter.rules.push(new ClearRule(this._dialog, this._store));

    this._interpreter.rules.push(new JobsRule(this._jobMgr));
    this._interpreter.rules.push(new JobLogRule(this._jobMgr, this._dialog));

    this._interpreter.rules.push(new WatchRule(
      this._dialog, this._store, this._logger
    ));
    this._interpreter.rules.push(new DynamicWatchRule(
      this._dialog, this._logger
    ));

    this._interpreter.rules.push(new LearnRule(this._dialog, this._store));
    this._interpreter.rules.push(
      new DoLearningRule(
        this._dialog, this._store, this._jobMgr, this._executionMgr
      )
    );

    this._completion = new Subject<void>();
  }

  get running() {
    return this._running;
  }

  start(): Observable<void> {
    this._dialog.say('Hello Sir');
    this._running = true;

    this.run();
    return this._completion;
  }

  run() {
    this.queryAction().subscribe({
      next() {},
      error: (err) => {
        this._logger.error('Stopping on error', err);
        this.quit();
      },
      complete: () => {
        this._running ? this.run() : this.quit();
      }
    });
  }

  queryAction(): Observable<{}> {
    return Observable.fromPromise(this._dialog.ask('What to do?\n'))
      .flatMap(answer => {
        const result = this._interpreter.interpret(answer);
        if (Maybe.isDefined(result)) {
          if (!result.asynchronous && result.progress) {
            return result.progress;
          }

          if (result.asynchronous && result.progress) {
              this._jobMgr.registerJob(result.progress, result.description);
          }

          return Observable.empty();
        } else {
          this._dialog.report('Unknown action');
          return Observable.empty();
        }
      });
  }

  quit() {
    this._running = false;
    this._dialog.say('Good bye Sir');
    this.emit('close');
    this._completion.complete();

    return {
      asynchronous: false
    };
  }
}

export default Instance;
