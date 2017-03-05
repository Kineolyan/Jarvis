const _ = require('lodash');

import Rule, {RuleAction} from './Rule';
import Dialog from '../interface/Dialog';
import Store from '../storage/Store';
import {ExecDefinition} from '../jobs/ExecJob';

const EXEC_STORE = 'execs';

class RecordRule extends Rule {
	constructor(private _dialog: Dialog, private _store: Store) {
		super(
			/^record (?:'(.+?)'|"(.+?)")/,
			args => {
				const name = args[1] || args[2];
				let newCmd: ExecDefinition;

				const progress = this._dialog.ask('Command to execute: ')
					.then(cmd => {
						newCmd = {cmd};
						return this._dialog.ask('Pwd for command (opt.): ');
					}).then(pwd => {
						if (!_.isEmpty(pwd)) {
							newCmd.cwd = pwd;
						}
					}).then(() => this._store.add(EXEC_STORE, name, newCmd));
				return { asynchronous: false, progress };
			}
		)
	}
}

class ClearRule extends Rule {
	constructor(private _dialog: Dialog, private _store: Store) {
		super(
			/^clear (?:'(.+?)'|"(.+?)")/,
			args => {
				const name = args[1] || args[2];
				const progress = this._store.delete(EXEC_STORE, name)
					.then(result => {
						if (!result) {
							this._dialog.report(`Tried to delete unknown rule |${name}|`);
						}
					});
				return { asynchronous: false, progress };
			}
		)
	}
}

export {
	RecordRule,
	ClearRule
};