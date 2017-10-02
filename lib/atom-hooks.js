'use babel';

import { CompositeDisposable } from 'atom';
import Config from './Config';
import Runner from './Runner';

export default {
  subscriptions: null,
  config: null,
  runner: null,

  activate() {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    this.config = new Config();
    this.runner = new Runner({ config: this.config });

    if (!atom.config.get('atom-hooks', false)) {
      atom.config.set('atom-hooks', {
        scripts: {},
        hooks: {
          onSave: {}
        }
      });
    }

    this.readConfig();

    this.subscriptions.add(
      atom.config.observe('atom-hooks', () => this.readConfig())
    );

    this.subscriptions.add(
      atom.workspace.observeTextEditors(textEditor =>
        this.subscriptions.add(
          textEditor.onDidSave(event => this.onSaveFile(event.path))
        )
      )
    );
  },

  readConfig() {
    this.config.setConfig({
      scripts: atom.config.get('atom-hooks.scripts', {}),
      hooks: atom.config.get('atom-hooks.hooks', {})
    });
  },

  onSaveFile(filePath) {
    this.runner
      .run(filePath, 'onSave')
      .catch(error =>
        this.notifyError('Error executing onSave scripts', error)
      );
  },

  notifyError(message, detail) {
    atom.notifications.addError(message, {
      detail:
        typeof detail === 'object' ? JSON.stringify(detail, null, 2) : detail,
      dismissable: true
    });
  },

  deactivate() {
    this.subscriptions.dispose();
  }
};
