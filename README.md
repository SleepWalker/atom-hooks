# Atom hooks package

[![Build Status (osx, linux)](https://travis-ci.org/SleepWalker/atom-hooks.svg?branch=master)](https://travis-ci.org/SleepWalker/atom-hooks)
[![Build status (windows)](https://ci.appveyor.com/api/projects/status/jntpdfoxco9ft4m7/branch/master?svg=true)](https://ci.appveyor.com/project/SleepWalker/atom-hooks/branch/master)
[![Dependency Status](https://david-dm.org/SleepWalker/atom-hooks.svg)](https://david-dm.org/SleepWalker/atom-hooks)

This is still beta, so no docs are available

```cson
'scripts':
    'sync': 'node foo'
'hooks':
    'onSave':
        '{bar, baz}': 'sync'
        '{bar, baz}': ['lint', 'sync']
        '{bar, baz}':conf
            '*.scss': 'compile'
            '*.js': ['lint', 'compile']
```

## Supported hooks

* `onSave` — triggered, after file save

Create an issue if you want some more hooks

## Usage

### Rsync file on save

If you are working with remote server, you probably need a way to upload changed files back to the server. This can be done using `onSave` hook with `rsync` and `ssh`:

```cson
"*":
  "atom-hooks":
    hooks:
        "~/path/to/project/**": "rsync -rltvzR -e ssh ${project}/./${relative} user@host:~/path/to/remote/project"
```

## Available script variables

For the following path `/path/to/the/project/src/file.js` you will get the next variables to use in your scripts:

```js
{
  project: '/path/to/the/project',
  root: '/',
  path: '/path/to/the/project/src/file.js',
  relative: 'src/file.js',
  dir: '/path/to/the/project/src',
  base: 'file.js',
  ext: '.js',
  name: 'file'
}
```
