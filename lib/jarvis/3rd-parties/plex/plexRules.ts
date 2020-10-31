import { Observable } from 'rxjs';

import * as Maybe from '../../func/Maybe';
import {RuleAction, ProcessRule, ProcessResult} from '../../parser/Rule';
import Dialog from '../../interface/Dialog';
import Logger from '../../interface/Logger';
import Process from '../../system/Process';

import * as plex from './tools';

class Plexify extends ProcessRule {
	constructor(private _dialog: Dialog) {
		super(
      /^plexify serie ('.+?'|".+?"|[^\s]+) ((?: *(?:'.+?'|".+?"|[^\s]+))+)/,
      args => this.organizeEpisodes(args)
    );
	}

  organizeEpisodes(args: any): ProcessResult {
    const serie = ProcessRule.getQuotedArg(args[1]);
    const episodes = this.extractEpisodes(args[2]);

    const progress = this.mapEpisodes(episodes)
      .then(mapping => {
        let summary = 'Organizing as\n';
        for (const episode in mapping) {
          const def = mapping[episode];
          summary += ` * [${episode}] -> ${def.season}x${def.episode}\n`;
        }
        return this._dialog.ask(`${summary}\nOk [Y|n]?`)
          .then(answer => /^\s*y?\s*$/.test(answer) ? mapping : null);
      })
      .then(mapping => {
        if (mapping) {
          return plex.organize(serie, mapping);
        }
      });

    return {
      asynchronous: false,
      progress: Process.fromPromise(progress),
      description: `Plexifying ${episodes.length} items for ${serie}`
    };
  }

  extractEpisodes(input: string): string[] {
    const pattern = /('.+?'|".+?"|[^\s]+)/g;
    let matches;
    const episodes: string[] = [];
    while ((matches = pattern.exec(input))) {
      const episode = ProcessRule.getQuotedArg(matches[1]);
      episodes.push(episode);
    }

    return episodes;
  }

  mapEpisodes(episodes) {
    return episodes.reduce(
      (chain, episodePath) => chain
        .then(map => {
          const guess = plex.guessEpisode(episodePath);
          const guessStr = Maybe.doOrElse(guess, guess => `${guess.season}x${guess.episode}`, '<unknown>');
          return this._dialog.ask(`[${episodePath}] -> ${guessStr}'\nepisode number [Y|ssee]: `)
            .then(value => {
              let metadata;
              if (value) {
                const number = parseInt(value, 10);
                metadata = {
                  season: Math.floor(number / 100),
                  episode: number % 100
                };
              } else if (Maybe.isDefined(guess)) {
                metadata = Maybe.get(guess);
              } else {
                throw new Error(`Did not defined an episode number to ${episodePath}`);
              }

              map[episodePath] = metadata;

              return map;
            });
        }),
      Promise.resolve({})
    );
  }
}


class PurifyPlex extends ProcessRule {
	constructor() {
		super(
      /^purify plex\s*$/,
      () => this.purify()
    );
	}

  purify(): ProcessResult {
    return {
      asynchronous: true,
      progress: Process.fromPromise(plex.purify()),
      description: 'Purifying plex repository'
    };
  }
}

export {
  Plexify,
  PurifyPlex
};