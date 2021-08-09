MongooSh
========
A Mongoose command line shell.

**Features:**
* It's Mongoose! A much easier to understand wrapper around Mongo with less foot-guns
* Does not allow access to non-existant collections - trying to do `db.nonExistantCollection.find()` will error out that find is not callable on undefined
* Easily extendable command plugin system
* Customizable config files along with a plugin system to add your own functionality
* STFU about server messages on boot - e.g. "Oh no! You're not using XFS!"


Installation
------------
Install globally by running

```
> npm install --global mongoosh
```

And connect to the test database with:

```
> mongoosh test
```



Built in commands
-----------------

| Command            | Description                                                                                                                                                    |
|--------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `db`               | The loaded `Mongoose.model` instance                                                                                                                           |
| `help`             | Built in command to list all other commands with their descriptions                                                                                            |
| `settings`         | The settings structure MongooSh was booted with                                                                                                                |
| `use <db>`         | Switch to an alternative database by name                                                                                                                      |
| `show collections` | List available collections                                                                                                                                     |
| `.break`           | When in the process of inputting a multi-line expression, enter the `.break` command (or press Ctrl+C) to abort further input or processing of that expression |
| `.clear`           | Resets the REPL context to an empty object and clears any multi-line expression being input                                                                    |
| `.exit`            | Close the I/O stream, causing the REPL to exit                                                                                                                 |
| `.help`            | Show the list of special commands                                                                                                                              |
| `.save`            | Save the current REPL session to a file e.g. `.save ./file/to/save.js`                                                                                         |
| `.load`            | Load a file into the current REPL session e.g. `.load ./file/to/load.js`                                                                                       |
| `.editor`          | Enter editor mode (Ctrl+D to finish, Ctrl+C to cancel)                                                                                                         |


Settings
--------

| Setting                  | Type                 | Default                      | Description                                                                  |
|--------------------------|----------------------|------------------------------|------------------------------------------------------------------------------|
| `colors`                 | `Object`             | See object                   | Various color specifications, see object for full list                       |
| `context`                | `Object`             | See notes                    | The context passed to the REPL, see notes below                              |
| `edit`                   | `Object`             | See below                    | Configuration for the `edit` command                                         |
| `edit.parse`             | `Function`           | (JSON.parse)                 | How to convert the input back from the editor into a Mongo compatible object |
| `edit.stringify`         | `Function`           | (JSON.stingify using tabs)   | How to convert a Mongo Object into text to pass to the editor                |
| `eval`                   | `Object`             | See below                    | Various settings to configure how the command evaluator works                |
| `eval.classes`           | `Array`              | See notes                    | An array of instance functions which should be waited on before output       |
| `eval.commands`          | `Object<Function>`   | See notes                    | Lookup object of internal commands                                           |
| `inspect`                | `Object`             | See below                    | Settings passed to util.inspect when showing the output of an object         |
| `inspect.depth`          | `Number`             | `2`                          | The maximum depth to inspect to before digesting the remaining data          |
| `inspect.colors`         | `Boolean`            | `true`                       | Whether to use colors when inspecting                                        |
| `mongoose`               | `Object`             | See below                    | Various options used when connecting to Mongoose                             |
| `mongoose.autoConnect`   | `Boolean`            | `true`                       | Whether to automatically connect to Mongoose and set up `db`                 |
| `mongoose.database`      | `String`             |                              | The database to connect to, if blank use `use <database>` to switch          |
| `mongoose.host`          | `String`             | `'localhost'`                | Host to connect to                                                           |
| `paths`                  | `Object`             | See below                    | Object storing various paths to load assets from                             |
| `paths.commands`         | `Array<String>`      | `['${__dir}/commands/*.js']` | Array of globs to load command plugins from                                  |
| `prompt`                 | `Object`             | See below                    | Various settings to tweak the MongooSh prompt appearance                     |
| `prompt.text`            | `String`             | `'> '`                       | The prompt text to display                                                   |
| `prompt.ignoreUndefined` | `Boolean`            | `true`                       | Don't print output of commands that return `undefined`                       |
| `prompt.preview`         | `Boolean`            | `true`                       | Show command output previews                                                 |
| `prompt.history`         | `Boolean` / `String` | `'.mongoosh.history'`        | Path to a file to store session history. Use boolean `false` to disable      |


**Notes:**
* The `context` setting is populated with the global objects specified in [Built in commands](#built-in-commands)
* `eval.classes` defaults to suitable list of Mongoose classes such as `Query` which will be evaluated before output
* `eval.commands` is a lookup object containing internal commands to the function called. see [Extending MonooSh](#extending-monoosh) for more information
* All `color.*` keys are strings representing any valid [Chalk](https://github.com/chalk/chalk) methods separated by spaces e.g. `'blue'`, `'bold underline yellow'`


Custom config / imports
-----------------------
MongooSh supports several configuration file types which are loaded when running the command line shell.

* `~/.mongoosh.json` - Loaded as simple JSON and merged with the global settings
* `~/.mongoosh.js` - Imported as a CJS script, the contents of `module.exports` is merged with the global settings
* `~/.mongoosh.mjs` - Imported as a ESM module, the output of `exports default` is merged with the global settings


Extending MonooSh
-----------------
There are multiple ways to extend MongooSh, all of them revolve around injecting script into the config files (either `.js` or `.mjs` variants).

### Extend commands directly

To add your own commands or other functionality simply extend the context passed to any of the config imports.

All custom commands and config files are called with the context of `mongooshContext` which is an object composed of:

| Key        | Type     | Description                          |
|------------|----------|--------------------------------------|
| `repl`     | `Repl`   | The active Node REPL instance        |
| `settings` | `Object` | POJO for the active session settings |

The context can be mutated by any plugin directly.

For example to define the `foo` custom command add the following to `~/.mongoosh.js`:

```javascript
// If the config returns a function it is called with the context `mongooshContext`
module.exports = function() {

	// Glue `foo` into the custom commands object
	this.settings.eval.commands.foo = function(bar, baz) {
		console.log('You tried to run the Foo command with arguments', bar, baz);
	};

	// Glue some help text to describe the command in `help`
	this.settings.eval.commands.foo.description = 'Command that does something';

};
```


### Define a globbable directory for commands

Extend the `settings.paths.commands` array to point to your own custom directory of commands.


```javascript
# In ~/.mongoosh.js
module.exports = function() {
	this.settings.paths.commands.push('/home/user/my/dir/of/commands/*.js');
};
```

```javascript
# In /home/user/my/dir/of/commands/awesome.js
export let description = 'My awesome command';

export default function(foo, bar, baz) {
	// ... //
}
```
