import * as CP from 'child_process';
import store from 'jarvis/storage/Store';

interface ExecDefinition {
  cmd: string;
  cwd?: string;
}

export class ExecJob {
  constructor(private _def: ExecDefinition) {}

  execute() {
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

  static tasks(key: string): ExecDefinition {
    const values = store.load('execs');
    return key !== undefined ? values[key] : values;
  }

  static create(name: string): ExecJob {
    const def = ExecJob.tasks(name);
    if (def !== undefined) {
      return new ExecJob(def);
    } else {
      return undefined;
    }
  }
}

export default ExecJob;
