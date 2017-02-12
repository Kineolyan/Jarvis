const fs = require('fs');
import {expect} from 'chai';

import {JsonFileApi} from './StorageApi';

const toPromise = (fn) => {
  return (...args) => new Promise((resolve, reject) => {
    fn(...args, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
const readFile = toPromise(fs.readFile);
const writeFile = toPromise(fs.writeFile);

describe('JsonFileApi', () => {
  describe('#read', () => {
    it('reads and parses the content of a given file', function() {
      const filePath = '/tmp/jarvis-jsonfileapi.json';
      return writeFile(filePath, '{"values": [1, 2]}')
        .then(() => new JsonFileApi(filePath).read())
        .then(data => {
          expect(data).to.eql({values: [1, 2]});
        });
    });
  });

  describe('#write', () => {
    it('writes values as JSON content', function() {
      const value = {values: [1, 2]};
      const filePath = '/tmp/jarvis-jsonfileapi.json';
      const api = new JsonFileApi(filePath);
      return api.write(value)
        .then(() => readFile(filePath))
        .then(JSON.parse)
        .then(data => {
          expect(data).to.eql(value);
        });
    });
  });
});