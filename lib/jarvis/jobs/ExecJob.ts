import { Observable } from 'rxjs';

import Process from '../system/Process';
import {getStore} from '../storage/Store';
import Job from './Job';

export interface ExecDefinition {
  cmd: string;
  cwd?: string;
}

export class ExecJob implements Job {
  private _unsubscriber: any;
  constructor(private _def: ExecDefinition) {}

  execute() {
    const options: any = {};
    if (this._def.cwd !== undefined) {
      options.cwd = this._def.cwd;
    }

    return Process.execute(this._def.cmd, [], options);
  }

  stop() {
    if (this._unsubscriber) {
      this._unsubscriber();
      this._unsubscriber = null;
      return true;
    } else {
      return false;
    }
  }

  static tasks(): Promise<{[key: string]: ExecDefinition}>;
  static tasks(key: string): Promise<ExecDefinition>;
  static tasks(key?: string): Promise<any> {
    return getStore().get('execs')
      .then(values => key !== undefined ? values[key] : values);
  }

  static create(name: string): Promise<ExecJob> {
    return ExecJob.tasks(name)
      .then(def => def !== undefined ? new ExecJob(def) : undefined);
  }
}

export default ExecJob;
