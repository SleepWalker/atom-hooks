'use babel';

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
            throw new Error('Can not interpret command value: ' + command);
          }
        }

        return acc;
      }, []);
    };

    return matchCommands(hookCommands);
  }

  setConfig(config) {
    this.config = {
      scripts: {},
      hooks: {},
      ...config
    };
  }
}
