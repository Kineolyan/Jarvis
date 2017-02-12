const fs = require('fs');
const _ = require('lodash');

interface StorageApi<T> {
  read(): Promise<T>;
  write(content: T): Promise<void>;
}

class JsonFileApi implements StorageApi<Object> {
  constructor(private _filePath: string) {}

  read() {
    return new Promise((resolve, reject) => {
      fs.readFile(this._filePath, {encoding: 'utf8', flag: 'r'}, (err, data) => {
        if (!err) {
           resolve(data && data.length >= 2 ? data : '{}');
        } else {
          reject(err);
        }
      });
    }).then(JSON.parse);
  }

  write(content: Object): Promise<void> {
    const value = JSON.stringify(content, null, 2);

    return new Promise<void>((resolve, reject) => {
      fs.writeFile(this._filePath, value, err => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      })
    });
  }
}

class InMemoryApi implements StorageApi<Object> {
  private _value: Object;

  constructor() {
    this._value = {};
  }

  read() {
    return Promise.resolve(_.cloneDeep(this._value));
  }

  write(content) {
    this._value = content;
    return Promise.resolve();
  }
}

export default StorageApi;
export {
  JsonFileApi,
  InMemoryApi
};
