'use babel';

import _Object$keys from 'babel-runtime/core-js/object/keys';
import _Object$entries from 'babel-runtime/core-js/object/entries';

import minimatch from 'minimatch';

const supportedHooks = ['onSave', 'manual'];

/**
 * Manages config and matches file path to specific command depending on hook name
 */
export default class Config {

  constructor() {
    this.setConfig({});
  }

  getCommands(filePath, hook) {
    const hookCommands = this.hooks[hook] || {};

    const matchCommands = (commands, patternPrefix = '') => {
      return _Object$entries(commands).reduce((acc, [pattern, commands]) => {
        if (minimatch(filePath, patternPrefix + pattern, { dot: true })) {
          commands.forEach(command => acc.push(command));
        }

        return acc;
      }, []);
    };

    return matchCommands(hookCommands);
  }

  /**
   * Lists all hooks available for file
   *
   * @param  {string} filePath
   *
   * @return {Array<{ name: Hook, command: string }}
   */
  listHooks(filePath) {
    return _Object$keys(this.hooks).map(hook => this.getCommands(filePath, hook).map(command => ({
      name: hook,
      command
    }))).reduce((arr1, arr2) => arr1.concat(arr2));
  }

  /**
   * Sets and normalizes config
   *
   * @param {Object} config
   */
  setConfig(config) {
    this.hooks = this.normalize(config);
  }

  /**
   * Normalizes config
   *
   * @param  {Object} config
   *
   * @return {{ [key: Hook]: { [path: string]: Array<string> } }}
   */
  normalize(config) {
    const hooks = {};
    const scripts = config.scripts || {};

    const addHookCommand = (mayBeHook, pattern, commands) => {
      const hook = supportedHooks.find(enumItem => enumItem === mayBeHook);

      if (!hook) {
        return;
      }

      if (!hooks[hook]) {
        hooks[hook] = {};
      }

      if (!hooks[hook][pattern]) {
        hooks[hook][pattern] = [];
      }

      if (typeof commands === 'string') {
        commands = [commands];
      }

      commands.forEach(cmd => hooks[hook][pattern].push(scripts[cmd] || cmd));
    };

    const processCommand = (hook, pattern, command) => {
      if (typeof command === 'string' || command instanceof Array) {
        addHookCommand(hook, pattern, command);
      } else if (typeof command === 'object') {
        // nested path patterns. Matching the next level
        _Object$entries(command).forEach(([nestedPattern, cmd]) => {
          addHookCommand(hook, [pattern, nestedPattern].join('/'), cmd);
        });
      } else {
        throw new Error(`Can not interpret command value: ${command}`);
      }
    };

    if (typeof config.hooks === 'object') {
      _Object$entries(config.hooks).forEach(([hook, commands]) => {
        _Object$entries(commands).forEach(([pattern, command]) => {
          processCommand(hook, pattern, command);
        });
      });
    }

    if (typeof config.files === 'object') {
      _Object$entries(config.files).forEach(([pattern, hookMap]) => {
        _Object$entries(hookMap).forEach(([hook, command]) => {
          processCommand(hook, pattern, command);
        });
      });
    }

    return hooks;
  }
}