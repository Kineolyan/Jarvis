import {EventEmitter} from 'events';
import {Observable, Subject, from, empty} from 'rxjs';
import {flatMap} from 'rxjs/operators';

import {isOutput, isCompletion} from './system/Process';
import Dialog from './interface/Dialog';
import Logger from './interface/Logger';
import Interpreter from './parser/Interpreter';
import {ProcessResult, syncSuccess} from './parser/Rule';
import ExecutionManager from './learning/program/ExecutionManager';
import RecoveryManager from './learning/recovery/RecoveryManager';
import JobManager from './jobs/JobManager';
import Store, {buildDefaultStore, setStore} from './storage/Store'; // FIXME stop using singleton
import { IO } from './interface/IOs';
import * as Maybe from './func/Maybe';

import {QuestionRule, HelpRule} from './parser/defaultRules';
import {RunRule, WatchRule, DynamicWatchRule, QuitRule} from './parser/basicRules';
import {RecordRule, ClearRule} from './parser/autoRules';
import {JobsRule, JobLogRule} from './parser/jobRules';
import LearnRule from './learning/LearnRule';
import DoLearningRule, {ShowLearningRule} from './learning/DoLearningRule';
import {ResumeLearningRule, DropLearningRule}  from './learning/ResumingRules';
import {Plexify, PurifyPlex} from './3rd-parties/plex/plexRules';
import InspectRule from './learning/inspect/InspectRule';

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
  private _recoveryMgr: RecoveryManager;
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
    this._recoveryMgr = new RecoveryManager(this._jobMgr);
    this._interpreter = new Interpreter<ProcessResult>();

    this._interpreter.rules.push(
      new HelpRule(this._dialog, this._interpreter, syncSuccess),
      new QuestionRule(this._dialog),

      new RunRule(this._dialog, this._logger),
      new QuitRule(() => this.quit()),

      new RecordRule(this._dialog, this._store),
      new ClearRule(this._dialog, this._store),

      new JobsRule(this._jobMgr, syncSuccess),
      new JobLogRule(this._jobMgr, this._dialog, syncSuccess),

      new WatchRule(this._dialog, this._store, this._logger),
      new DynamicWatchRule(this._dialog, this._logger),

      new LearnRule(this._dialog, this._store),
      new DoLearningRule(
        this._dialog, this._store, this._jobMgr, this._executionMgr, this._recoveryMgr
      ),
      new ShowLearningRule(this._dialog, this._store),
      new ResumeLearningRule(this._executionMgr),
      new DropLearningRule(this._executionMgr),

      new Plexify(this._dialog),
      new PurifyPlex(),

      new InspectRule(this._dialog, this._jobMgr)
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

  doAction(input: string): Promise<number> {
    const result = this._interpreter.interpret(input);
    if (Maybe.isDefined(result)) {
      const {progress: process} = Maybe.get(result);
      if (process !== undefined) {
        return new Promise((resolve, reject) => {
          try {
            process.subscribe({
              next: message => {
                if (isOutput(message)) {
                  if (message.source === 'out') {
                    this._dialog.say(message.data);
                  } else {
                    this._dialog.report(message.data);
                  }
                } else if (isCompletion(message)) {
                  resolve(message.code);
                } else {
                  console.error(`Unknown message`, message);
                }
              },
              error: err => reject(err)
            });
          } catch (err) {
            return reject(err);
          }
        });
      } else {
        return Promise.resolve(0);
      }
    } else {
      this._dialog.report('Unknown action');
      return Promise.resolve(1);
    }
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

  private buildQuestion(): string {
    const notifs: string[] = [];
    const pendingCount = this._dialog.getPendingQuestions().length;
    if (pendingCount > 0) {
      notifs.push(`${pendingCount} questions`);
    }

    const postPonedCount = this._executionMgr.count;
    if (postPonedCount > 0) {
      notifs.push(`${postPonedCount} postponed`);
    }

    const notifMessage = notifs.length > 0
      ? ` (${notifs.join(', ')})`
      : '';
    return `What to do?${notifMessage}\n`;
  }

  queryAction(): Observable<{}> {
    return from(this._dialog.ask(this.buildQuestion()))
      .pipe(flatMap(answer => {
        const r = this._interpreter.interpret(answer);
        if (Maybe.isDefined(r)) {
          const result = Maybe.get(r);
          if (!result.asynchronous && result.progress) {
            return result.progress;
          }

          if (result.asynchronous && result.progress) {
              this._jobMgr.registerJob(result.progress, result.description);
          }

          return empty();
        } else {
          this._dialog.report('Unknown action');
          return empty();
        }
      }));
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
