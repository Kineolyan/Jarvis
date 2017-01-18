import {EventEmitter} from 'events';

import Dialog from './interface/Dialog';
import Interpreter from './parser/Interpreter';
import {RunRule, QuitRule} from './parser/basicRules';
import {RecordRule, ClearRule} from './parser/autoRules';
import JobManager from './jobs/JobManager';
import ExecJob from './jobs/ExecJob';
import store from './storage/Store'; // FIXME stop using singleton
import { IO } from './interface/IOs';

/**
 * The main class of the project starting everything
 */
class Instance extends EventEmitter {
  private _running: boolean;
  private _dialog: Dialog;
  private _jobMgr: JobManager;
  private _interpreter: Interpreter;
  private _logger: any;

  constructor(io: IO, name: string) {
    super();

    this._running = false;
    this._logger = console;
    this._dialog = new Dialog(io);
    if (name !== undefined) {
      this._dialog.name = name;
    }
    this._jobMgr = new JobManager(this._dialog);
    this._interpreter = new Interpreter();

    this._interpreter.rules.push(new RunRule(this._dialog, this._logger));
    this._interpreter.rules.push(new QuitRule(() => this.quit()));

    this._interpreter.rules.push(new RecordRule(this._dialog, store));
    this._interpreter.rules.push(new ClearRule(store));
  }

  get running() {
    return this._running;
  }

  start() {
    this._dialog.say('Hello Sir');
    this._running = true;

    return this.run();
  }

  run() {
    return this.queryAction().then(() => {
      if (this._running) {
        return this.run();
      } else {
        return true;
      }
    });
  }

  queryAction() {
    return this._dialog.ask('What to do?\n').then(answer => {
      const result = this._interpreter.interpret(answer);
      if (result) {
        if (result.asynchronous && result.progress) {
            this._jobMgr.registerJob(result.progress);
        }

        return !result.asynchronous && result.progress ?
          result.progress : Promise.resolve();
      } else {
        this._dialog.report('Unknown action');
        return Promise.resolve();
      }
    });
  }

  quit() {
    this._running = false;
    this._dialog.say('Good bye Sir');
    this.emit('close');
    return {
      asynchronous: false,
      progress: null
    };
  }
}

export default Instance;
