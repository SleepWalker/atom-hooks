'use babel';

import { parse as parsePath } from 'path';
import { exec } from 'child_process';

export default class Runner {
  /**
   * @param  {Object} options
   * @param  {Config} options.config
   */
  constructor(options = {}) {
    this.config = options.config;

    if (!this.config) {
      throw new Error('Config instance is required');
    }
  }

  /**
   * Runs an array of commands on file
   *
   * @param {string} filePath
   * @param {string} hook
   *
   * @return {Promise<void>}
   */
  run(filePath, hook) {
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
   * Collects the data related to current file and project
   *
   * Structure example:
   * {
   *   project: '/home/user',
   *   root: '/',
   *   path: '/home/user/dir/file.txt',
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
  getVars(filePath) {
    const [projectPath] = atom.project.relativizePath(filePath);
    const pathParts = parsePath(filePath);

    return {
      project: projectPath || pathParts.dir,
      path: filePath,
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
  interpolate(command, vars) {
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
  execute(command, options) {
    return new Promise((resolve, reject) =>
      exec(command, options, (error, stdout, stderr) => {
        if (error) {
          reject({
            name: error.name,
            message: error.message,
            stderr,
            stdout
          });
        }

        resolve();
      })
    );
  }
}
