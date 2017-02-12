import StorageApi, {JsonFileApi} from './StorageApi';

interface ResourceApi {
  get(): Promise<any>;

  add(name: string, object: any): Promise<void>;

  delete(name: string): Promise<boolean>;
}

class MapApi implements ResourceApi {
  private _cache: Promise<Object>;

  constructor(private _store: StorageApi<Object>) {
    this._cache = null;
  }

  get(): Promise<any> {
    if (!this._cache) {
      this._cache = this._store.read();
    } else {
    }

    return this._cache;
  }

  add(name: string, object: any): Promise<void> {
    return this.get().then(values => {
      values[name] = object;
      this._cache = Promise.resolve(values);
      return this._store.write(values)
        .catch(() => this.invalidateCache());
    });
  }

  delete(name: string): Promise<boolean> {
    return this.get().then(values => {
      const isPresent = Reflect.has(values, name);
      if (isPresent) {
        Reflect.deleteProperty(values, name);
        this._cache = Promise.resolve(values);

        return this._store.write(values)
          .then(() => {
            return true;
          })
          .catch(err => {
            this.invalidateCache();
            return Promise.reject(err);
          });
      } else {
        return Promise.resolve(false);
      }
    });
  }

  private invalidateCache(): void {
    this._cache = null;
  }
}

export default ResourceApi;
export {
  MapApi
};
