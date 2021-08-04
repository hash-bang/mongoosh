#!/usr/bin/node
import _ from 'lodash';
import colors from 'chalk';
import {promises as fs} from 'node:fs';
import getColor from './lib/getColor.js';
import joi from 'joi';
import os from 'node:os';
import path from 'path';
import program from 'commander';
import repl from 'node:repl';
import ttys from 'ttys';
import util from 'node:util';

const packageMeta = JSON.parse(await fs.readFile('package.json'));

program
	.version(packageMeta.version)
	.name('mongoosh')
	.usage('[options]')
	.option('-v, --verbose', 'Be verbose. Specify multiple times for increasing verbosity', function(i, v) { return v + 1 }, 0)
	.option('--no-color', 'Force disable color')
	.parse(process.argv);

// Populate settings structure {{{
const settings = {
	inspect: {
		depth: 2,
		colors: true,
	},
	prompt: {
		text: '> ',
		color: 'bold blue',
	},
};
// }}}

// Main promise
Promise.resolve()
	// Load settings from INI file if it exists {{{
	.then(()=> Promise.all([
		fs.readFile(path.join(os.homedir(), '.mongoosh.json'))
			.then(contents => JSON.parse(contents))
			.then(parsed => _.merge(settings, parsed))
			.then(()=> true)
			.catch(()=> false), // Give up if trying to read a non-existant file

		fs.access(path.join(os.homedir(), '.mongoosh.js'))
			.then(()=> import(path.join(os.homedir(), '.mongoosh.js')))
			.then(parsed => _.merge(settings, parsed.default))
			.then(()=> true),

		fs.access(path.join(os.homedir(), '.mongoosh.mjs'))
			.then(()=> import(path.join(os.homedir(), '.mongoosh.mjs')))
			.then(parsed => _.merge(settings, parsed.default))
			.then(()=> true)
			.catch(()=> false),
	]))
	.then(configsLoaded =>
		configsLoaded.some(Boolean) // We loaded some config?
		&& joi.object({ // Check it validates
			inspect: {
				depth: joi.number(),
				colors: joi.boolean(),
			},
			prompt: {
				text: joi.string(),
				color: joi.string(),
			},
		}).validate(settings)
	)

	// }}}
	// Repl loop {{{
	.then(()=> new Promise(resolve => repl
		.start({
			// BUGFIX: If we are reading from a pipe we need ttys to provide us a user terminal rather than trust process.std{in,out} {{{
			input: ttys.stdin,
			output: ttys.stdout,
			terminal: true,
			// }}}
			useColors: program.color,
			prompt: getColor(settings.prompt.color)(settings.prompt.text),
			writer: function(doc) {
				return util.inspect(doc, settings.inspect);
			},
		})
		.on('exit', resolve)
	))
	.catch(e => console.log(colors.red('ERROR', e)))
