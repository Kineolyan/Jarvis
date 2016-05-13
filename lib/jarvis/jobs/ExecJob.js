import * as CP from 'child_process';
import store from 'jarvis/storage/Store';

export class ExecJob {
  constructor(def) {
    this._def = def;
  }

  execute() {
    const options = {};
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
}

ExecJob.tasks = function(key) {
  const values = store.load('execs');
  return key !== undefined ? values[key] : values;
};

ExecJob.create = function(name) {
  const def = ExecJob.tasks(name);
  if (def !== undefined) {
    return new ExecJob(def);
  } else {
    return undefined;
  }
}

export default ExecJob;
