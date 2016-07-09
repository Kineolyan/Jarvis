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
});
