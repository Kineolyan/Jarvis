export class Store {
  private _directory: string;
  private _resources: Map<String, any>;

  constructor() {
    this._directory = 'tasks';
    this._resources = new Map<String, any>();
  }

  get(resource: string) {
    return this.load(resource);
  }

  add(resource: string, name: string, object: any): Store {
    if (!this._resources.has(resource)) {
      this.load(resource);
    }

    const resources = this._resources.get(resource);
    if (resource === 'execs') {
      resources[name] = object;
    } else {
      throw new Error(`Cannot add resource ${resource}`);
    }

    return this;
  }

  load(resource: string) {
    if (this._resources.has(resource)) {
      return this._resources.get(resource);
    } else {
      if (resource === 'execs') {
        const tasks = require(`${this._directory}/execs.json`);
        this._resources.set(resource, tasks);
        return tasks;
      } else {
        throw new Error(`Cannot load resource ${resource}`);
      }
    }
  }

  delete(resource: string, name: string): boolean {
    const resources = this._resources.get(resource);
    if (resources) {
      if (resource === 'execs') {
        Reflect.deleteProperty(resources, name);
        return true;
      } else {
        throw new Error(`Cannot add resource ${resource}`);
      }
    } else {
      return false;
    }
  }

  forTests() {
    this._directory = '../../../spec/fixtures';
    return this;
  }
}

export default new Store();
