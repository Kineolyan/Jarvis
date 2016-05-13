export class Store {
  constructor() {
    this._directory = 'tasks';
  }

  load(resource) {
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
