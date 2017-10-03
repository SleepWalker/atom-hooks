# Atom hooks package
[![Build Status (osx, linux)](https://travis-ci.org/SleepWalker/atom-hooks.svg?branch=master)](https://travis-ci.org/SleepWalker/atom-hooks)
[![Build status (windows)](https://ci.appveyor.com/api/projects/status/jntpdfoxco9ft4m7/branch/master?svg=true)](https://ci.appveyor.com/project/SleepWalker/atom-hooks/branch/master)
[![Dependency Status](https://david-dm.org/SleepWalker/atom-hooks.svg)](https://david-dm.org/SleepWalker/atom-hooks)

This is still beta, so no docs are available

```
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
