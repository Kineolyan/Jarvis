import {expect} from 'chai';

import {MapApi} from './ResourceApi';
import {InMemoryApi} from './StorageApi';

describe('MapApi', () => {
  let api: MapApi, storage: InMemoryApi;

  beforeEach(() => {
    storage = new InMemoryApi();
    api = new MapApi(storage);

    storage.write({key: 'value'});
  });

  describe('#get', () => {
    it('retrieves the value from the storage', () => {
      return Promise.all([
        api.get(), storage.read()
      ]).then(([storeValue, apiValue]) => {
        expect(apiValue).to.eql(storeValue);
      });
    });

    it('caches the value', () => {
      return api.get() // Reads and cache values
        .then(() => storage.write({})) // Desynchronize cache and storage
        .then(() => api.get())
        .then(storeValue => {
          expect(storeValue).to.eql({ key: 'value' });
        });
    });
  });

  describe('#add', () => {
    beforeEach(() => {
      return api.add('newKey', 1);
    });

    it('adds a new key', () => {
      return storage.read()
        .then(data => {
          expect(data).to.eql({
            key: 'value',
            newKey: 1
          });
        });
    });

    it('provides the updated value', () => {
      return api.get()
        .then(data => {
          expect(data).to.eql({
            key: 'value',
            newKey: 1
          });
        });
    });

    it('recreates the cache after an addition', () => {
      return storage.write({}) // Desync with store
        .then(() => api.get())
        .then(values => {
          expect(values).to.eql({
            key: 'value',
            newKey: 1
          })
        });
    });
  });

  describe('#delete', () => {
    let result: boolean;
    beforeEach(() => {
      return api.delete('key')
        .then(r => { result = r; });
    });

    it('returns true upon success', () => {
      expect(result).to.equal(true);
    });

    it('removes the key', () => {
      return storage.read()
        .then(data => {
          expect(data).to.eql({});
        });
    });

    it('provides the updated value', () => {
      return api.get()
        .then(data => {
          expect(data).to.eql({});
        });
    });

    it('recreates the cache after a delete', () => {
      return storage.write({ newContent: 13 }) // Desync with store
        .then(() => api.get())
        .then(values => {
          expect(values).to.eql({});
        });
    });
  });
});