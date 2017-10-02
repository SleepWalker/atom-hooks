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
