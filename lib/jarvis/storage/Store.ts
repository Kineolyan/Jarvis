const path = require('path');
const fs = require('fs');
const _ = require('lodash');

import ResourceApi, {MapApi} from './ResourceApi';
import {JsonFileApi, InMemoryApi} from './StorageApi';

type ResourceMapping = Map<string, ResourceApi>;
class Store {
  /**
   * constructor
   * @param _mapping mapping of resources to a storage file
   */
  constructor(private _apis: ResourceMapping) {}

  get(resource: string): Promise<any> {
    if (this._apis.has(resource)) {
      const api = this._apis.get(resource);
      return api.get();
    } else {
      throw new Error(`Cannot get unknown resource ${resource}`);
    }
  }

  add(resource: string, name: string, object: any): Promise<void> {
    if (this._apis.has(resource)) {
      const api = this._apis.get(resource);
      return api.add(name, object);
    } else {
      throw new Error(`Cannot add resource ${resource}`);
    }
  }

  delete(resource: string, name: string): Promise<boolean> {
    if (this._apis.has(resource)) {
      const api = this._apis.get(resource);
      return api.delete(name);
    } else {
      throw new Error(`Cannot delete resource ${resource}`);
    }
  }
}

function buildStore(Storage, cbk: (mapping: ResourceMapping) => void = _.noop): Store {
  const mapping = new Map();
  const dataDirectory = 'data';

  mapping.set(
    'execs',
    new MapApi(new Storage(
      path.join(__dirname, '..', '..', '..', dataDirectory, 'execs.json'))
    )
  );
  cbk(mapping);

  return new Store(mapping);
}

const buildDefaultStore = () => buildStore(JsonFileApi);
const buildTestStore = (cbk?: (mapping: ResourceMapping) => void) => buildStore(InMemoryApi, cbk);

let defaultStore: Store;
function getStore() {
  if (!defaultStore) {
    defaultStore = buildDefaultStore();
  }
  return defaultStore;
}
function setStore(store: Store) {
  defaultStore = store;
}

export default Store;
export {
  buildDefaultStore,
  buildTestStore,
  getStore,
  setStore
};
