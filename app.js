#!/usr/bin/node
import {promises as fs} from 'node:fs';
import getColor from './lib/getColor.js';
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


const replInstance = repl
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
	});
