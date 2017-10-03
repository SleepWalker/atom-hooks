'use babel';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

import minimatch from 'minimatch';

/**
 * Manages config and matches file path to specific command depending on hook name
 */
export default class Config {

  constructor() {
    this.setConfig({});
  }

  getCommands(filePath, hook) {
    const { scripts } = this.config;
    const hookCommands = this.config.hooks[hook] || {};

    const matchCommands = (commands, patternPrefix = '') => {
      return Object.entries(commands).reduce((acc, [pattern, command]) => {
        if (minimatch(filePath, patternPrefix + pattern, { dot: true })) {
          if (typeof command === 'string') {
            command = [command];
          }

          if (command instanceof Array) {
            command.forEach(item => acc.push(scripts[item] || item));
          } else if (typeof command === 'object') {
            // nested path patterns. Matching the next level
            acc = acc.concat(matchCommands(command, '**/'));
          } else {
            // $FlowFixMe
            throw new Error('Can not interpret command value: ' + command);
          }
        }

        return acc;
      }, []);
    };

    return matchCommands(hookCommands);
  }

  listHooks(filePath) {
    return Object.keys(this.config.hooks).map(hook => this.getCommands(filePath, hook).map(command => ({
      name: hook,
      command
    }))).reduce((arr1, arr2) => arr1.concat(arr2));
  }

  setConfig(config) {
    this.config = _extends({
      scripts: {},
      hooks: {}
    }, config);
  }
}