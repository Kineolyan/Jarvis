import {expect} from 'chai';

import Store, {buildTestStore} from './Store';

describe('Jarvis::Storage::Store', function () {
  let store: Store;

  beforeEach(function () {
    return new Promise(resolve => {
      store = buildTestStore(mapping => {
        const execs = mapping.get('execs');
        execs.add('test', { cmd: 'echo \'test\'' })
          .then(() => resolve());
      });
    })
  });

  describe('#get', function () {
    it('retrieves the execs', function () {
      return store.get('execs')
        .then(tasks => {
          expect(tasks).not.to.be.undefined;
          expect(tasks.test).to.eql({ cmd: 'echo \'test\''});
        });
    });
  });

  describe('#add', function() {
    beforeEach(function() {
      return store.add('execs', 'hello', {
        cmd: 'echo hello world'
      });
    });

    it('loads the wanted resources', function() {
      return store.get('execs')
        .then(tasks => {
          expect(tasks).to.contain.any.keys(['test']);
        });
    });

    it('adds the wanted elements to the resource', function() {
      return store.get('execs')
        .then(tasks => {
          expect(tasks).to.contain.any.keys(['hello']);
        });
    });
  });

  describe('#delete', function() {
    beforeEach(function() {
      return store.add('execs', 'hello', {
        cmd: 'echo hello world'
      });
    });

    it('deletes the wanted item', function() {
      return store.delete('execs', 'hello')
        .then(() => store.get('execs'))
        .then(tasks => {
          expect(tasks).not.to.contain.any.keys(['hello']);
        });
    });

    it('returns true on success', function() {
      return store.delete('execs', 'hello')
        .then(success => {
          expect(success).to.eql(true)
        });
    });
  });
});
