export class Store {
  private _directory: string;
  private _tasks: Array<any>;

  constructor() {
    this._directory = 'tasks';
  }

  load(resource: string) {
    if (resource === 'execs') {
      if (this._tasks === undefined) {
        this._tasks = require(`${this._directory}/execs.json`);
      }
      return this._tasks;
    } else {
      throw new Error(`Cannot load resource ${resource}`);
    }
  }

  forTests() {
    this._directory = '../../../spec/fixtures';
    return this;
  }
}

export default new Store();
