import Config from './Config';

it('should return command for hook', () => {
  const file = 'foo/bar.js';
  const hook = 'onSave';
  const expectedCommand = 'test command';
  const config = new Config();

  config.setConfig({
    hooks: {
      onSave: {
        '**': expectedCommand
      }
    }
  });

  expect(config.getCommands(file, hook)).toEqual([expectedCommand]);
});

it('should match dot files in path', () => {
  const file = '/home/test/.atom/config.cson';
  const hook = 'onSave';
  const expectedCommand = 'test command';
  const config = new Config();

  config.setConfig({
    hooks: {
      onSave: {
        '**': expectedCommand
      }
    }
  });

  expect(config.getCommands(file, hook)).toEqual([expectedCommand]);
});

it('should return commands that match path pattern', () => {
  const file = 'foo/bar.js';
  const hook = 'onSave';
  const expectedCommand = 'test command';
  const config = new Config();

  config.setConfig({
    hooks: {
      onSave: {
        'bar/*.js': 'bad command',
        'foo/*.js': expectedCommand
      }
    }
  });

  expect(config.getCommands(file, hook)).toEqual([expectedCommand]);
});

it('should return multiple commands for hook', () => {
  const file = 'foo/bar.js';
  const hook = 'onSave';
  const expectedCommands = ['test command', 'command 2'];
  const config = new Config();

  config.setConfig({
    hooks: {
      onSave: {
        'bar/*.js': 'bad command',
        '{foo, bar}/*.js': expectedCommands[0],
        '**/*.js': expectedCommands[1]
      }
    }
  });

  expect(config.getCommands(file, hook)).toEqual(expectedCommands);
});

it('should return empty array if no commands', () => {
  const file = '/dev/null';
  const hook = '/dev/null';
  const config = new Config();

  expect(config.getCommands(file, hook)).toEqual([]);
});

it('should use scripts to resolve command aliases', () => {
  const file = 'foo/bar.js';
  const hook = 'onSave';
  const expectedCommand = 'test command';
  const config = new Config();

  config.setConfig({
    scripts: {
      someScript: expectedCommand
    },
    hooks: {
      onSave: {
        '**': 'someScript'
      }
    }
  });

  expect(config.getCommands(file, hook)).toEqual([expectedCommand]);
});

it('should accept multiple scripts for pattern', () => {
  const file = 'foo/bar.js';
  const hook = 'onSave';
  const expectedCommands = ['test command', 'other command', 'command3'];
  const config = new Config();

  config.setConfig({
    scripts: {
      someScript: expectedCommands[0]
    },
    hooks: {
      onSave: {
        '**': ['someScript', expectedCommands[1]],
        '**/*.js': expectedCommands[2]
      }
    }
  });

  expect(config.getCommands(file, hook)).toEqual(expectedCommands);
});

it('should expand nested patterns', () => {
  const file1 = 'foo/bar.js';
  const file2 = 'foo/baz.scss';
  const hook = 'onSave';
  const expectedCommand = 'test command';
  const config = new Config();

  config.setConfig({
    scripts: {
      someScript: expectedCommand
    },
    hooks: {
      onSave: {
        '**': {
          '*.js': 'someScript',
          '*.scss': 'someScript'
        }
      }
    }
  });

  expect(config.getCommands(file1, hook)).toEqual([expectedCommand]);
  expect(config.getCommands(file2, hook)).toEqual([expectedCommand]);
});
