const _ = require('lodash');

import Rule, {RuleAction} from './Rule';
import Dialog from '../interface/Dialog';
import {Store} from '../storage/Store';
import {ExecDefinition} from '../jobs/ExecJob';

const EXEC_STORE = 'execs';

class RecordRule extends Rule {
	constructor(private _dialog: Dialog, private _store: Store) {
		super(
			/^record (?:'(.+?)'|"(.+?)")/,
			matches => {
				const name = matches[1] || matches[2];
				let newCmd: ExecDefinition = null;
				return this._dialog.ask('Command to execute: ')
					.then(cmd => {
						newCmd = {cmd};
						return this._dialog.ask('Pwd for command (opt.): ');
					}).then(pwd => {
						if (!_.isEmpty(pwd)) {
							newCmd.cwd = pwd;
						}
					}).then(() => {
						this._store.add(EXEC_STORE, name, newCmd);
					});
			}
		)
	}
}

class ClearRule extends Rule {
	constructor(private _store: Store) {
		super(
			/^clear (?:'(.+?)'|"(.+?)")/,
			matches => {
				const name = matches[1] || matches[2];
				this._store.delete(EXEC_STORE, name);
				return Promise.resolve();
			}
		)
	}
}

export {
	RecordRule,
	ClearRule
};