'use babel';
// @flow

import { parse as parsePath } from 'path';
import { lstatSync } from 'fs';
import { exec } from 'child_process';
import type Config, { Hook } from './Config';

export default class Runner {
  config: Config;

  /**
   * @param  {Object} options
   * @param  {Config} options.config
   */
  constructor(options: { config: Config }) {
    this.config = options.config;
  }

  /**
   * Runs hook on file
   *
   * @param {string} filePath
   * @param {string} hook
   *
   * @return {Promise<void>}
   */
  runHook(filePath: string, hook: Hook) {
    const commands = this.config.getCommands(filePath, hook);
    const vars = this.getVars(filePath);

    return commands.reduce(
      (promise, command) =>
        promise.then(() =>
          this.execute(this.interpolate(command, vars), {
            cwd: vars.project,
            timeout: 10000 // protect from infinite loops in commands
          })
        ),
      Promise.resolve()
    );
  }

  /**
   * Runs a command on a file
   *
   * @param  {string} filePath
   * @param  {string} command
   *
   * @return {Promise<void>}
   */
  runCommand(filePath: string, command: string) {
    const vars = this.getVars(filePath);

    return this.execute(this.interpolate(command, vars), {
      cwd: vars.project,
      timeout: 10000 // protect from infinite loops in commands
    });
  }

  /**
   * Collects the data related to current file and project
   *
   * Structure example:
   * {
   *   project: '/home/user',
   *   root: '/',
   *   path: '/home/user/dir/file.txt',
   *   relative: 'dir/file.txt',
   *   dir: '/home/user/dir',
   *   base: 'file.txt',
   *   ext: '.txt',
   *   name: 'file'
   * }
   *
   * @param {string} filePath
   *
   * @return {Object}
   */
  getVars(filePath: string) {
    filePath = filePath.replace(/\/+$/, '');

    const [projectPath, relativePath] = atom.project.relativizePath(filePath);
    const pathParts = parsePath(filePath);

    if (lstatSync(filePath).isDirectory()) {
      pathParts.name = pathParts.name + pathParts.ext;
      pathParts.ext = '';
    }

    return {
      project: projectPath || pathParts.dir,
      path: filePath,
      relative: projectPath ? relativePath : pathParts.base,
      ...pathParts
    };
  }

  /**
   * Replaces ${vars} in command
   *
   * @param  {string} command
   * @param  {{[key: stirng]: string}} vars
   *
   * @return {string}
   */
  interpolate(command: string, vars: { [key: string]: string }) {
    return command.replace(
      /\$\{([^}]+)\}/g,
      (match, key) => vars[key] || match
    );
  }

  /**
   * Execute shell command
   *
   * @param  {string} command
   * @param  {Object} options - child_process.exec options
   * @param  {number} options.timeout - the time allowed for command to execute
   * @param  {number} options.cwd - working dir of command
   *
   * @return {Promise}
   */
  execute(
    command: string,
    { timeout, cwd }: { timeout?: number, cwd?: string } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) =>
      exec(
        command,
        {
          cwd,
          timeout
        },
        (error, stdout, stderr) => {
          if (error) {
            reject({
              name: error.name,
              message: error.message,
              stderr,
              stdout
            });
          }

          resolve();
        }
      )
    );
  }
}
