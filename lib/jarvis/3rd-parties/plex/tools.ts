import * as fs from 'fs';
import * as path from 'path';

import * as Maybe from '../../func/Maybe';

const PLEX_FOLDER = '/mnt/Grishka/Media/TV Shows';
const plexPath: (...string) => string = path.join.bind(null, PLEX_FOLDER);

const toPromise = f => (...args) => new Promise((resolve, reject) => {
	try {
		f(...args, (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(result);
			}
		});
 	} catch (fErr) {
		reject(fErr);
	}
});
const access = toPromise(fs.access);
//*
const symlink: (...any) => Promise<any> = toPromise(fs.symlink);
const unlink: (string) => Promise<any> = toPromise(fs.unlink);
const rmdir: (string) => Promise<any> = toPromise(fs.rmdir);
/*/
const symlink = (from, to) => new Promise(r => {
	console.log('linking', from, '->', to);
	r();
});
const unlink: (string) => Promise<any> = dirPath => new Promise(r => {
	console.log('unlinking', dirPath);
	r();
});
//*/
const rawMkdir = toPromise(fs.mkdir);
const mkdir: (string) => Promise<any> = (dirPath) => rawMkdir(dirPath)
	.catch(err => {
		if (err.code === 'EEXIST') {
			// OK, concurrent creation
			return Promise.resolve();
		} else {
			return Promise.reject(err);
		}
	});
const readdir: (string) => Promise<any> = toPromise(fs.readdir);
const lstat: (string) => Promise<any> = toPromise(fs.lstat);
const readlink: (string) => Promise<any> = toPromise(fs.readlink);

function ensureFolder(folder: string): Promise<any> {
	return access(folder, fs.constants.F_OK)
		.catch(err => mkdir(folder))
}

function createSerieFolder(serie: string): Promise<any> {
	return ensureFolder(plexPath(serie));
}

function linkEpisode(filePath: string, serie: string, {season, episode}: SerieMetadata): Promise<any> {
	const extension = path.extname(filePath);
	const absPath = path.isAbsolute(filePath)
		? filePath
		: path.join(process.cwd(), filePath);

	const seasonName = `Season ${toSerieNb(season)}`;
	const episodePath = plexPath(serie, seasonName, `${serie} - s${toSerieNb(season)}e${toSerieNb(episode)}${extension}`);
	return ensureFolder(plexPath(serie, seasonName))
		.then(() => symlink(absPath, episodePath));
}

function toSerieNb(value: number): string {
	return value < 10 ? `0${value}` : value.toString();
}

function guessEpisode(episode: string): Maybe.Option<SerieMetadata>{
	const episodeName = path.basename(episode);
	const exprs = [/s(\d{2})e(\d{2})/i];
	for (const expr of exprs) {
		const matchs = expr.exec(episodeName);
		if (matchs) {
			return Maybe.just({
				season: parseInt(matchs[1]),
				episode: parseInt(matchs[2])
			});
		}
	}
	return Maybe.none();
}

interface SerieMetadata {
		season: number;
		episode: number;
}

function organize(serie: string, mapping: {[file: string]: SerieMetadata}): Promise<any> {
	return createSerieFolder(serie)
		.then(() => Promise.all(
			Object.keys(mapping).map(episode => {
				const def = mapping[episode];
				return linkEpisode(episode, serie, def);
			})
		));
}

function purifyLink(filePath: string) {
	return readlink(filePath)
		.then(realPath => lstat(realPath)
			.catch(() => unlink(filePath)));
}

function removeDeadLinks(dirPath: string): Promise<any> {
	return readdir(dirPath)
		.then(entries => Promise.all(
			entries.map(entry => {
				const entryPath = path.join(dirPath, entry);
				return lstat(entryPath)
					.then(entryStat => {
						if (entryStat.isSymbolicLink()) {
							return purifyLink(entryPath);
						} else if (entryStat.isDirectory()) {
							return removeDeadLinks(entryPath)
						} else {
							return Promise.resolve();
						}
					});
			})));
}

function removeEmptySeasons(): Promise<any> {
	return readdir(plexPath())
		.then(series => Promise.all(
			series.map(serie => readdir(plexPath(serie))
				.then(seasons => (seasons as string[]).map(season => plexPath(serie, season))))
		))
		.then(results => {
			const allSeasons = results.reduce((list, items) => list.concat(items), []);
			return Promise.all(
				allSeasons.map(seasonPath => readdir(seasonPath)
					.then(episodeList => episodeList.length === 0
						? rmdir(seasonPath)
						: Promise.resolve())));
		});
}

function purify(): Promise<any> {
	return removeDeadLinks(plexPath())
		.then(() => removeEmptySeasons());
}

export {
	// Types
	SerieMetadata,
	// Functions
	guessEpisode,
	organize,
	purify
};
