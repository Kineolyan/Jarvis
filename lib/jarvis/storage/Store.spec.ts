import {expect} from 'chai';

import { Store } from './Store';

describe('Jarvis::Storage::Store', function () {
  beforeEach(function () {
    this.store = new Store().forTests();
  });

  describe('#load', function () {
    it('loads the execs', function () {
      const tasks = this.store.load('execs');
      expect(tasks).not.to.be.undefined;
      expect(tasks.test).to.eql({ cmd: 'echo \'test\''});
    });
  });

  describe('#add', function() {
    beforeEach(function() {
      this.store.add('execs', 'hello', {
        cmd: 'echo hello world'
      });
    });

    it('loads the wanted resources', function() {
      const tasks = this.store.get('execs');
      expect(tasks).to.contain.any.keys(['test']);
    });

    it('adds the wanted elements to the resource', function() {
      const tasks = this.store.get('execs');
      expect(tasks).to.contain.any.keys(['hello']);
    });
  });

  describe('#delete', function() {
    beforeEach(function() {
      this.store.add('execs', 'hello', {
        cmd: 'echo hello world'
      });
    });

    it('deletes the wanted item', function() {
      this.store.delete('execs', 'hello');
      const tasks = this.store.get('execs');
      expect(tasks).not.to.contain.any.keys(['hello']);
    });

    it('returns true on success', function() {
      expect(this.store.delete('execs', 'hello')).to.eql(true);
    });
  });
});
