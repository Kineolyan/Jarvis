import * as CP from 'child_process';
import {getStore} from '../storage/Store';
import Job from './Job';

export interface ExecDefinition {
  cmd: string;
  cwd?: string;
}

export class ExecJob implements Job<string> {
  constructor(private _def: ExecDefinition) {}

  execute(): Promise<string> {
    const options: any = {};
    if (this._def.cwd !== undefined) {
      options.cwd = this._def.cwd;
    }

    return new Promise((resolve, reject) => {
      try {
        CP.exec(this._def.cmd, options, (error, stdout/* , stderr */) => {
          // console.log(`stdout: ${stdout}`);
          // console.log(`stderr: ${stderr}`);
          if (error === null) {
            resolve(stdout);
          } else {
            // console.log(`exec error: ${error}`);
            reject(error);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  stop(): boolean {
    // TODO stop the child process, with a signal
    throw new Error('Operation not implemented');
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
