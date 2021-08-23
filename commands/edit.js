import _ from 'lodash';
import colors from 'chalk';
import {spawn} from 'node:child_process';
import {promisify} from 'util';
import {promises as fs} from 'node:fs';
import mongoose from 'mongoose';
import temp from 'temp';

import {inspect} from 'util';

export let description = 'Edit the output of a Mongoose query in your prefered editor, saving the result if changed';

/**
* Show an entity
* @param {...string} query The query to run to return result(s)
* @returns {Promise} A promise which resolves when the operation has completed
*/
export default function(...query) {
	const tempPath = temp.path({
		prefix: this.settings.mongoose.database + '-',
		suffix: '.json',
	});
	const fakeDate = new Date('1970-01-01T00:00:00.000Z'); // Fake date in the past to set the temp file date to so we can see if it was written
	let queryResponse;
	let model = query.join(' ').replace(/^db\.(.+?)\..+$/, '$1');
	if (!model) console.warn('Cannot determine query model from expression');

	return Promise.resolve()
		.then(()=> process.env.EDITOR || Promise.reject('The EDITOR environment variable is not set to provide an editor'))
		.then(()=> promisify(this.repl.eval)(query.join(' '), this.repl.context, 'COMMAND:EDIT'))
		.then(res =>
			res instanceof mongoose.Document // Single Mongoose document - .findOne / .findById etc.
			|| (Array.isArray(res) && res.every(r => r instanceof mongoose.Document)) // Array of documents - .find etc.
				? res
				: Promise.reject('Result is not a single or array of Mongoose.Document instances')
		)
		.then(res => queryResponse = res)
		.then(()=> this.settings.edit.stringify(queryResponse))
		.then(contents => fs.writeFile(tempPath, contents))
		.then(()=> fs.utimes(tempPath, fakeDate, fakeDate))
		.then(()=> console.log('Written to', tempPath))
		.then(()=> new Promise((resolve, reject) => {
			const child = spawn(process.env.EDITOR, [tempPath], {stdio: 'inherit'})
			child.on('exit', code => code == 0 ? resolve() : reject(`Exited with code ${code}`));
		}))
		.then(()=> fs.stat(tempPath))
		.then(stats => stats.mtime > fakeDate ? true : Promise.reject('No changes made, aborting'))
		.then(()=> fs.readFile(tempPath, 'utf8'))
		.then(contents => this.settings.edit.parse(contents))
		.then(res => {
			if (Array.isArray(queryResponse)) { // Array of documents mode
				if (queryResponse.length != res.length) throw new Error(`Expected response back from editor to be an array of ${queryResponse.length} but got ${res.length}`);
				console.log('Saving', queryResponse.length, 'documents');
				return Promise.all(queryResponse.map((doc, docIndex) => {
					doc.$set(res[docIndex]);
					return doc.save();
				}));
			} else { // Single document
				console.log('Saving document', colors.cyan(res._id));
				console.log('SPLAT', res);
				return this.settings.context.db[model].updateOne({_id: res._id}, res);
			}
		})
		.then(()=> fs.unlink(tempPath))
};
