'use babel';
// @flow

import minimatch from 'minimatch';

export type Hook = 'onSave' | 'manual';

type ConfigCommand = string | Array<string>;
type GlobPattern = string;
type ConfigCommandOrNestedPattern =
  | ConfigCommand
  | { [pattern: GlobPattern]: ConfigCommand };
type ConfigDefinition = {
  scripts?: { [key: string]: string },
  files?: {
    [pattern: GlobPattern]: { [hook: Hook]: ConfigCommandOrNestedPattern }
  },
  hooks?: {
    [key: Hook]: { [pattern: GlobPattern]: ConfigCommandOrNestedPattern }
  }
};
type HooksDefinition = { [key: Hook]: { [path: string]: Array<string> } };

const supportedHooks: Array<Hook> = ['onSave', 'manual'];

/**
 * Manages config and matches file path to specific command depending on hook name
 */
export default class Config {
  hooks: HooksDefinition;

  constructor() {
    this.setConfig({});
  }

  getCommands(filePath: string, hook: Hook) {
    const hookCommands = this.hooks[hook] || {};

    const matchCommands = (commands, patternPrefix = '') => {
      return Object.entries(
        commands
      ).reduce((acc, [pattern, commands]: [string, any]) => {
        if (minimatch(filePath, patternPrefix + pattern, { dot: true })) {
          (commands: Array<string>).forEach(command => acc.push(command));
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
  listHooks(filePath: string): Array<{ name: Hook, command: string }> {
    return Object.keys(this.hooks)
      .map((hook: any) =>
        this.getCommands(filePath, (hook: Hook)).map(command => ({
          name: hook,
          command
        }))
      )
      .reduce((arr1, arr2) => arr1.concat(arr2));
  }

  /**
   * Sets and normalizes config
   *
   * @param {Object} config
   */
  setConfig(config: ConfigDefinition) {
    this.hooks = this.normalize(config);
  }

  /**
   * Normalizes config
   *
   * @param  {Object} config
   *
   * @return {{ [key: Hook]: { [path: string]: Array<string> } }}
   */
  normalize(config: ConfigDefinition): HooksDefinition {
    const hooks: HooksDefinition = {};
    const scripts: { [key: string]: string } = config.scripts || {};

    const addHookCommand = (
      mayBeHook: string,
      pattern: GlobPattern,
      commands: ConfigCommand
    ) => {
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
        Object.entries(
          command
        ).forEach(([nestedPattern, cmd]: [string, any]) => {
          addHookCommand(hook, [pattern, nestedPattern].join('/'), cmd);
        });
      } else {
        throw new Error(`Can not interpret command value: ${command}`);
      }
    };

    if (typeof config.hooks === 'object') {
      Object.entries(config.hooks).forEach(([hook, commands]) => {
        Object.entries(
          commands
        ).forEach(([pattern, command]: [string, any]) => {
          processCommand(hook, pattern, command);
        });
      });
    }

    if (typeof config.files === 'object') {
      Object.entries(config.files).forEach(([pattern, hookMap]) => {
        Object.entries(hookMap).forEach(([hook, command]: [string, any]) => {
          processCommand(hook, pattern, command);
        });
      });
    }

    return hooks;
  }
}
