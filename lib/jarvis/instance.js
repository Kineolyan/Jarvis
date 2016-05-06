import Dialog from 'jarvis/interface/dialog';
import Interpreter from 'jarvis/parser/interpreter';
import Rule from 'jarvis/parser/rule';
import EventEmitter from 'events';

/**
 * The main class of the project starting everything
 */
class Instance extends EventEmitter {
  constructor(io, name) {
    super();

    this._running = false;
    this._interpreter = new Interpreter();
    this._dialog = new Dialog(io);
    if (name !== undefined) {
      this._dialog.name = name;
    }

    this._interpreter.rules.push(new Rule(
      /^run (?:'(.+?)'|"(.+?)")/,
      matches => this._dialog.say(`Running '${matches[1]}'`)
    ));
    this._interpreter.rules.push(new Rule(
      /^\s*(exit|quit)\s*$/,
      () => this.quit()
    ));
  }

  get running() {
    return this._running;
  }

  start() {
    this._dialog.say('Hello Sir');
    this._running = true;

    return this.run();
  }

  run() {
    return this.queryAction().then(() => {
      if (this._running) {
        return this.run();
      } else {
        return true;
      }
    });
  }

  queryAction() {
    return this._dialog.ask('What to do?\n').then(answer => {
      const result = this._interpreter.interpret(answer);
      if(!result) {
        this._dialog.report('Unknown action');
      }

      return result;
    });
  }

  quit() {
    this._running = false;
    this._dialog.say('Good bye Sir');
    this.emit('close');
  }
}

export default Instance;
