'use babel';
// @flow

import minimatch from 'minimatch';

export type Hook = 'onSave';

type ConfigDefinition = {
  scripts: { [key: string]: string },
  hooks: {
    [key: Hook]:
      | string
      | Array<string>
      | { [key: string]: string | Array<string> }
  }
};

/**
 * Manages config and matches file path to specific command depending on hook name
 */
export default class Config {
  config: ConfigDefinition;

  constructor() {
    this.setConfig({});
  }

  getCommands(filePath: string, hook: Hook) {
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

  listHooks(filePath: string) {
    return Object.keys(this.config.hooks)
      .map((hook: any) =>
        this.getCommands(filePath, (hook: Hook)).map(command => ({
          name: hook,
          command
        }))
      )
      .reduce((arr1, arr2) => arr1.concat(arr2));
  }

  setConfig(config: Object) {
    this.config = {
      scripts: {},
      hooks: {},
      ...config
    };
  }
}
