MongooSh
========
A Mongoose command line shell.


Settings
--------

| Setting          | Type      | Default       | Description                                                          |
|------------------|-----------|---------------|----------------------------------------------------------------------|
| `inspect`        | `Object`  | See below     | Settings passed to util.inspect when showing the output of an object |
| `inspect.depth`  | `Number`  | `2`           | The maximum depth to inspect to before digesting the remaining data  |
| `inspect.colors` | `Boolean` | `true`        | Whether to use colors when inspecting                                |
| `prompt`         | `Object`  | See below     | Various settings to tweak the MongooSh prompt appearance             |
| `prompt.text`    | `String`  | `'> '`        | The prompt text to display                                           |
| `prompt.color`   | `String`  | `'bold blue'` | The coloring to use for the prompt                                   |

**Notes:**
* Colors are any valid [Chalk](https://github.com/chalk/chalk) method separated by spaces e.g. `'blue'`, `'bold underline yellow'`


Custom config / imports
-----------------------
MongooSh supports several configuration file types which are loaded when running the command line shell.

* `~/.mongoosh.json` - Loaded as simple JSON and merged with the global settings
* `~/.mongoosh.js` - Imported as a CJS script, the contents of `module.exports` is merged with the global settings
* `~/.mongoosh.mjs` - Imported as a ESM module, the output of `exports default` is merged with the global settings
