MongooSh
========
A Mongoose command line shell.


Built in commands
-----------------

| Command    | Description                                                                                                                                                    |
|------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `db`       | The loaded `Mongoose.model` instance                                                                                                                           |
| `settings` | The settings structure MongooSh was booted with                                                                                                                |
| `.break`   | When in the process of inputting a multi-line expression, enter the `.break` command (or press Ctrl+C) to abort further input or processing of that expression |
| `.clear`   | Resets the REPL context to an empty object and clears any multi-line expression being input                                                                    |
| `.exit`    | Close the I/O stream, causing the REPL to exit                                                                                                                 |
| `.help`    | Show the list of special commands                                                                                                                              |
| `.save`    | Save the current REPL session to a file e.g. `.save ./file/to/save.js`                                                                                         |
| `.load`    | Load a file into the current REPL session e.g. `.load ./file/to/load.js`                                                                                       |
| `.editor`  | Enter editor mode (Ctrl+D to finish, Ctrl+C to cancel)                                                                                                         |


Settings
--------

| Setting                  | Type                 | Default               | Description                                                             |
|--------------------------|----------------------|-----------------------|-------------------------------------------------------------------------|
| `context`                | `Object`             | See notes             | The context passed to the REPL, see notes below                         |
| `eval`                   | `Object`             | See below             | Various settings to configure how the command evaluator works           |
| `eval.classes`           | `Array`              | See notes             | An array of instance functions which should be waited on before output  |
| `inspect`                | `Object`             | See below             | Settings passed to util.inspect when showing the output of an object    |
| `inspect.depth`          | `Number`             | `2`                   | The maximum depth to inspect to before digesting the remaining data     |
| `inspect.colors`         | `Boolean`            | `true`                | Whether to use colors when inspecting                                   |
| `mongoose`               | `Object`             | See below             | Various options used when connecting to Mongoose                        |
| `mongoose.autoConnect`   | `Boolean`            | `true`                | Whether to automatically connect to Mongoose and set up `db`            |
| `mongoose.database`      | `String`             |                       | The database to connect to, if blank use `use <database>` to switch     |
| `mongoose.host`          | `String`             | `'localhost'`         | Host to connect to                                                      |
| `prompt`                 | `Object`             | See below             | Various settings to tweak the MongooSh prompt appearance                |
| `prompt.text`            | `String`             | `'> '`                | The prompt text to display                                              |
| `prompt.color`           | `String`             | `'bold blue'`         | The coloring to use for the prompt                                      |
| `prompt.ignoreUndefined` | `Boolean`            | `true`                | Don't print output of commands that return `undefined`                  |
| `prompt.preview`         | `Boolean`            | `true`                | Show command output previews                                            |
| `prompt.history`         | `Boolean` / `String` | `'.mongoosh.history'` | Path to a file to store session history. Use boolean `false` to disable |


**Notes:**
* The `context` setting is populated with the global objects specified in [Built in commands](#built-in-commands)
* `eval.classes` defaults to suitable list of Mongoose classes such as `Query` which will be evaluated before output
* Colors are any valid [Chalk](https://github.com/chalk/chalk) method separated by spaces e.g. `'blue'`, `'bold underline yellow'`


Custom config / imports
-----------------------
MongooSh supports several configuration file types which are loaded when running the command line shell.

* `~/.mongoosh.json` - Loaded as simple JSON and merged with the global settings
* `~/.mongoosh.js` - Imported as a CJS script, the contents of `module.exports` is merged with the global settings
* `~/.mongoosh.mjs` - Imported as a ESM module, the output of `exports default` is merged with the global settings
