import * as _ from 'lodash';
import * as fs from 'fs';

import {DefinitionRule, DefinitionResult} from '../../parser/Rule';
import Dialog from '../../interface/Dialog';
import Process from '../../system/Process';
import * as Maybe from '../../func/Maybe';
import {ExecDefinition} from '../../jobs/ExecJob';

class ExecRule extends DefinitionRule {
	constructor(private _dialog: Dialog) {
		super(
			/exec +(?:'(.+)'|"(.+)"|(.+)$)/,
			args => this.recordCommand(args)
		)
	}

	recordCommand(args): DefinitionResult {
		const command = args[1] || args[2] || args[3];
		const progress = this.getCommandPwd()
			.then(path => ({cmd: command, cwd: path}))
			.then(JSON.stringify);

		return {
			progress: progress
		};
	}

	getCommandPwd() {
		const cwd = process.cwd();
		return this._dialog
			.ask(`where shall I execute this ? I can use the current directory (${cwd})\n`)
			.then(pwd => {
				if (_.isEmpty(pwd)) {
					return cwd;
				} else {
					return this.checkPath(pwd)
						.then(check => Maybe.isDefined(check) ? check : this.correctPath(pwd));
				}
			});
	}

	checkPath(path: string): Promise<Maybe.Type<string>> {
		return new Promise<Maybe.Type<string>>((resolve, reject) => {
			try {
				fs.stat(path, err => {
					resolve(err ? Maybe.none() : Maybe.just(path));
				});
			} catch (err) {
				resolve(Maybe.none());
			}
		});
	}

	correctPath(path: string): Promise<string> {
		return this._dialog
			.ask(`Path ${path} is not valid. Correct it: `)
			.then(newPath => {
				if (!_.isEmpty(newPath)) {
					return this.checkPath(newPath)
						.then(check => Maybe.isDefined(check) ? check : this.correctPath(newPath));
				} else {
					return this.correctPath(path);
				}
			});
	}
}

export default ExecRule;