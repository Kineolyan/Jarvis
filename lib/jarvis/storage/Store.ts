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
    const api = this._apis.get(resource);
    if (api) {
      return api.get();
    } else {
      throw new Error(`Cannot get unknown resource ${resource}`);
    }
  }

  add(resource: string, name: string, object: any): Promise<void> {
    const api = this._apis.get(resource);
    if (api) {
      return api.add(name, object);
    } else {
      throw new Error(`Cannot add resource ${resource}`);
    }
  }

  delete(resource: string, name: string): Promise<boolean> {
    const api = this._apis.get(resource);
    if (api) {
      return api.delete(name);
    } else {
      throw new Error(`Cannot delete resource ${resource}`);
    }
  }
}

function buildStore(Storage, cbk: (mapping: ResourceMapping) => void = _.noop): Store {
  const mapping = new Map();
  const dataDirectory = 'data';
  const dataFilePath = (...args) => path.join(
    __dirname, '..', '..', '..', dataDirectory, ...args
  );

  mapping.set(
    'execs',
    new MapApi(new Storage(
      dataFilePath('execs.json')
    ))
  );
  mapping.set(
    'watches',
    new MapApi(new Storage(
      dataFilePath('watches.json'))
    )
  );
  mapping.set(
    'programs',
    new MapApi(new Storage(
      dataFilePath('programs.json'))
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