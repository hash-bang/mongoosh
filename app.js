#!/usr/bin/node
import _ from 'lodash';
import colors from 'chalk';
import {promises as fs} from 'node:fs';
import getColor from './lib/getColor.js';
import {globby} from 'globby';
import joi from 'joi';
import os from 'node:os';
import mongoose from 'mongoose';
import mongooseConnect from './lib/mongooseConnect.js';
import path from 'path';
import program from 'commander';
import repl from 'node:repl';
import ttys from 'ttys';
import url from 'node:url';
import util from 'node:util';
import vm from 'node:vm';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const packageMeta = JSON.parse(await fs.readFile('package.json'));

program
	.version(packageMeta.version)
	.name('mongoosh')
	.usage('[database]')
	.option('-e, --eval <expr...>', 'Execute an expression and quit. Can be specified multiple times', (v, t) => t.concat([v]), [])
	.option('-v, --verbose', 'Be verbose. Specify multiple times for increasing verbosity', (t, v) => t + 1, 0)
	.option('--no-color', 'Force disable color')
	.option('--no-eval-echo', 'Dont output eval command being executed into STDERR')
	.option('--no-eval-json', 'Dont switch into JSON output mode in eval - use regular terminal inspection system instead')
	.parse(process.argv);

const programOpts = program.opts();

// Populate settings structure {{{
const settings = {
	context: {},
	colors: {
		evalEchoColorPrefix: 'bgWhite black',
		evalEchoColorCommand: 'blue',
		prompt: 'bold blue',
	},
	edit: {
		stringify(obj) {
			return JSON.stringify(obj, null, '\t');
		},
		parse(text) {
			return JSON.parse(text);
		},
	},
	eval: {
		classes: [
			mongoose.Query,
		],
		commands: {},
		echoPrefix: 'EVAL',
	},
	inspect: {
		depth: 2,
		colors: true,
	},
	mongoose: {
		autoConnect: true,
		database: program.args.shift(),
		host: 'localhost',
	},
	paths: {
		commands: [
			`${__dirname}/commands/*.js`,
		],
	},
	prompt: {
		text: '> ',
		ignoreUndefined: true,
		preview: true,
		history: '.mongoosh.history',
	},
};
// }}}
// MongooSh context (used with commands to access internals) {{{
const mongooshContext = {
	repl: undefined,
	settings,
};
// }}}

// Main promise
Promise.resolve()
	// Load settings {{{
	.then(()=> Promise.all([
		fs.readFile(path.join(os.homedir(), '.mongoosh.json'))
			.then(contents => JSON.parse(contents))
			.then(parsed => _.merge(settings, parsed))
			.then(()=> true)
			.catch(()=> false), // Give up if trying to read a non-existant file

		fs.access(path.join(os.homedir(), '.mongoosh.js'))
			.then(()=> import(path.join(os.homedir(), '.mongoosh.js')))
			.then(parsed => _.isFunction(parsed.default) ? parsed.default.call(mongooshContext) : _.merge(settings, parsed.default))
			.then(()=> true),

		fs.access(path.join(os.homedir(), '.mongoosh.mjs'))
			.then(()=> import(path.join(os.homedir(), '.mongoosh.mjs')))
			.then(parsed => _.isFunction(parsed.default) ? parsed.default.call(mongooshContext) : _.merge(settings, parsed.default))
			.then(()=> true)
			.catch(()=> false),
	]))
	.then(configsLoaded =>
		configsLoaded.some(Boolean) // We loaded some config?
		&& joi.object({ // Check it validates
			eval: {
				classes: joi.array(),
				commands: joi.object().required(),
			},
			context: joi.object().required(),
			inspect: {
				depth: joi.number(),
				colors: joi.boolean(),
			},
			mongoose: {
				autoConnect: joi.boolean(),
				database: joi.string(),
				host: joi.string().required(),
			},
			prompt: {
				text: joi.string(),
				color: joi.string(),
				ignoreUndefined: joi.boolean(),
				preview: joi.boolean(),
				history: joi.valid(
					false,
					joi.string(),
				),
			},
		}).validate(settings)
	)
	// }}}
	// Load commands {{{
	.then(()=> globby(settings.paths.commands))
	.then(commandPaths => Promise.all(commandPaths.map(commandPath =>
		import(commandPath)
			.then(command => {
				var {name} = path.parse(commandPath);
				if (!_.isFunction(command.default)) throw new Error(`Command import from "${commandPath}" did not export a default function`);
				settings.eval.commands[name] = command.default;

				if (command.description) settings.eval.commands[name].description =  command.description; // Glue description onto function if we have one
			})
			.catch(e => {
				console.warn(colors.red('ERROR'), 'parsing command', colors.cyan(commandPath), e);
			})
	)))
	// }}}
	// Connect to Mongoose {{{
	.then(()=> {
		if (!settings.mongoose.autoConnect) return;

		return mongooseConnect.call(mongooshContext);
	})
	// }}}
	// Repl loop {{{
	.then(()=> new Promise((resolve, reject) => {
		const replInstance = mongooshContext.repl = repl
			.start({
				// BUGFIX: If we are reading from a pipe we need ttys to provide us a user terminal rather than trust process.std{in,out} {{{
				input: ttys.stdin,
				output: ttys.stdout,
				terminal: true,
				// }}}
				useGlobal: false,
				useColors: program.color,
				prompt: programOpts.eval.length > 0 ? '' : getColor(settings.colors.prompt)(settings.prompt.text),
				ignoreUndefined: settings.prompt.ignoreUndefined,
				preview: settings.prompt.preview,
				writer: function(doc) {
					return util.inspect(doc, settings.inspect);
				},
				eval: (cmd, context, filename, finish) => { // {{{
					// Try defined command {{{
					var cmdBits = cmd.split(/\s+/);
					cmdBits[0] = cmdBits[0].toLowerCase(); // Lower case command operand automatically to fix case weirdness
					if (settings.eval.commands[cmdBits[0]]) { // Command exists
						return Promise.resolve(settings.eval.commands[cmdBits[0]].apply(mongooshContext, cmdBits.slice(1)))
							.then(result => finish(null, result))
							.catch(finish)
					}
					// }}}
					// Try to run in context {{{
					try {
						var result = vm.runInContext(cmd, context, filename);
						if (settings.eval.classes.some(evalClass => result instanceof evalClass)) {
							return Promise.resolve(result)
								.then(result => finish(null, result))
						} else { // Don't bother to eval - treat as inline JS func
							finish(null, result);
						}
					} catch (e) {
						finish(e);
					}
					// }}}
				}, // }}}
			})
			.on('exit', resolve)

		// Assign context
		Object.assign(replInstance.context, settings.context);
		replInstance.context.settings = settings;

		// Setup history file
		if (settings.prompt.history)
			replInstance.setupHistory(path.join(os.homedir(), settings.prompt.history), ()=> {});


		// Process Evals (if any) {{{
		if (programOpts.eval.length > 0) {
			let evalOffset = 0;
			const execQueue = [...programOpts.eval];
			const execEval = ()=> {
				if (!execQueue.length) return resolve();
				var evalCommand = execQueue.shift();
				if (programOpts.evalEcho) console.warn(
					getColor(settings.colors.evalEchoColorPrefix)(settings.eval.echoPrefix),
					getColor(settings.colors.evalEchoColorCommand)(evalCommand)
				);

				replInstance.eval(evalCommand, replInstance.context, `EVAL:${evalOffset++}`, (err, res) => {
					if (err) return reject(err);
					Promise.resolve(replInstance.writer(res))
						.then(content => content !== undefined || settings.prompt.ignoreUndefined ? console.log(content) : false)
						.then(()=> execEval())
				});
			};
			setTimeout(execEval, 100);
		}
		// }}}
	}))
	.then(()=> process.exit(0))
	.catch(e => {
		console.log(colors.red('ERROR'), e);
		process.exit(1);
	})
