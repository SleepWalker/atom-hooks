'use babel';
// @flow
import { exec } from 'child_process';
import { lstatSync } from 'fs';
import Runner from '../lib/Runner';
import Config from '../lib/Config';

jest.mock('child_process');
jest.mock('fs');

beforeEach(() => {
  global.atom = {
    project: {
      relativizePath: jest.fn().mockReturnValue([null, ''])
    }
  };

  lstatSync.mockReturnValue({
    isDirectory: () => false
  });
});

afterEach(() => {
  delete global.atom;
});

it('should interpolate vars in commands', () => {
  const runner = new Runner({
    config: new Config()
  });

  const result = runner.interpolate('foo ${var}', { var: 'bar' });

  expect(result).toBe('foo bar');
});

describe('#getVars', () => {
  it('should extract vars from file path', () => {
    const runner = new Runner({
      config: new Config()
    });
    atom.project.relativizePath.mockReturnValue([
      '/path/to/the/project',
      'src/file.js'
    ]);

    const result = runner.getVars('/path/to/the/project/src/file.js');

    expect(result).toEqual({
      project: '/path/to/the/project',
      root: '/',
      path: '/path/to/the/project/src/file.js',
      relative: 'src/file.js',
      dir: '/path/to/the/project/src',
      base: 'file.js',
      ext: '.js',
      name: 'file'
    });
  });

  it('should extract vars from file path (no project)', () => {
    const runner = new Runner({
      config: new Config()
    });

    const result = runner.getVars('/some/path/to/file.js');

    expect(result).toEqual({
      project: '/some/path/to',
      root: '/',
      path: '/some/path/to/file.js',
      relative: 'file.js',
      dir: '/some/path/to',
      base: 'file.js',
      ext: '.js',
      name: 'file'
    });
  });

  it('should extract vars from dir path', () => {
    const runner = new Runner({
      config: new Config()
    });
    atom.project.relativizePath.mockReturnValue([
      '/path/to/the/project',
      'src/some.dir'
    ]);
    lstatSync.mockReturnValue({
      isDirectory: () => true
    });

    const result = runner.getVars('/path/to/the/project/src/some.dir');

    expect(result).toEqual({
      project: '/path/to/the/project',
      root: '/',
      path: '/path/to/the/project/src/some.dir',
      relative: 'src/some.dir',
      dir: '/path/to/the/project/src',
      base: 'some.dir',
      ext: '',
      name: 'some.dir'
    });
  });

  it('should remove trailing slashed from dirs', () => {
    const runner = new Runner({
      config: new Config()
    });

    const result = runner.getVars('/some/path/to/dir/');

    expect(result).toEqual({
      project: '/some/path/to',
      root: '/',
      path: '/some/path/to/dir',
      relative: 'dir',
      dir: '/some/path/to',
      base: 'dir',
      ext: '',
      name: 'dir'
    });
  });
});

describe('#execute()', () => {
  it('executes command', () => {
    const expectedCommand = 'foo bar';
    const expectedOptions = {
      cwd: '/foo',
      timeout: 123
    };
    const runner = new Runner({
      config: new Config()
    });

    exec.mockImplementation((command, options, callback) => {
      expect(command).toBe(expectedCommand);
      expect(options).toEqual(expectedOptions);
      callback(null, '', '');
    });

    return runner.execute(expectedCommand, expectedOptions);
  });

  it('rejects, when command execution failed', () => {
    const expectedCommand = 'foo bar';
    const runner = new Runner({
      config: new Config()
    });

    exec.mockImplementation((command, options, callback) => {
      expect(command).toBe(expectedCommand);
      callback(new Error('the error'), 'stdout', 'stderr');
    });

    return runner.execute(expectedCommand).catch(error => {
      expect(error).toEqual({
        name: 'Error',
        message: 'the error',
        stdout: 'stdout',
        stderr: 'stderr'
      });
    });
  });
});

describe('#runCommand()', () => {
  it('runs command and interpolates vars', () => {
    const expectedCommand = 'foo bar/baz';
    const expectedOptions = {
      cwd: 'bar',
      timeout: 10000
    };
    const runner: Object = new Runner({
      config: new Config()
    });
    runner.execute = jest.fn(() => Promise.resolve());

    return runner.runCommand('bar/baz', 'foo ${path}').then(() => {
      expect(runner.execute.mock.calls[0]).toEqual([
        expectedCommand,
        expectedOptions
      ]);
    });
  });
});

describe('#run()', () => {
  it('runs all commands by path and hook', () => {
    const expectedFilePath = '/foo/bar/baz.js';
    const commands = ['command 1', `command 2 ${expectedFilePath}`];
    const config = {
      getCommands: jest.fn((filePath, hook) => {
        expect(filePath).toBe(expectedFilePath);
        expect(hook).toBe('onSave');

        return ['command 1', 'command 2 ${path}'];
      })
    };
    const runner = new Runner({
      config: (config: any)
    });

    commands.forEach(curCmd =>
      exec.mockImplementationOnce((command, options, callback) => {
        expect(command).toBe(curCmd);
        expect(options).toEqual({
          cwd: '/foo/bar',
          timeout: 10000
        });

        callback(null, '', '');
      })
    );

    return runner.runHook(expectedFilePath, 'onSave');
  });

  it('rejects if one of commands have failed', () => {
    const expectedFilePath = '/foo/bar/baz.js';
    const commands = ['command 1', `command 2 ${expectedFilePath}`];
    const config = {
      getCommands: jest.fn((filePath, hook) => {
        expect(filePath).toBe(expectedFilePath);
        expect(hook).toBe('onSave');

        return ['command 1', 'command 2 ${path}'];
      })
    };
    const runner = new Runner({
      config: (config: any)
    });

    commands.forEach(curCmd =>
      exec.mockImplementationOnce((command, options, callback) => {
        expect(command).toBe(curCmd);
        expect(options).toEqual({
          cwd: '/foo/bar',
          timeout: 10000
        });

        callback(new Error('error'), '', '');
      })
    );

    return runner
      .runHook(expectedFilePath, 'onSave')
      .catch(() => expect(exec.mock.calls.length).toBe(1));
  });
});
