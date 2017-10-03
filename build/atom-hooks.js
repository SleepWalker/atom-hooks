'use babel';

import { CompositeDisposable } from 'atom';
import HooksListView from './views/HooksListView';
import StatusView from './views/StatusView';
import Config from './Config';
import Runner from './Runner';

export default {
  statusBarTile: null,
  statusView: null,
  subscriptions: null,
  config: null,
  runner: null,

  activate() {
    this.subscriptions = new CompositeDisposable();
    this.config = new Config();
    this.runner = new Runner({ config: this.config });
    this.statusView = new StatusView();

    if (!atom.config.get('atom-hooks')) {
      atom.config.set('atom-hooks', {
        scripts: {},
        hooks: {
          onSave: {}
        }
      });
    }

    this.readConfig();

    this.subscriptions.add(atom.commands.add('atom-text-editor', 'atom-hooks:show', () => this.onToggleHooksList()));

    this.subscriptions.add(atom.config.observe('atom-hooks', () => this.readConfig()));

    this.subscriptions.add(atom.workspace.getCenter().observeActivePaneItem(item => this.onChangeActivePane(item)));

    this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => this.subscriptions.add(textEditor.onDidSave(event => this.onSaveFile(event.path)))));
  },

  readConfig() {
    this.config.setConfig({
      scripts: atom.config.get('atom-hooks.scripts') || {},
      hooks: atom.config.get('atom-hooks.hooks') || {}
    });
  },

  getCurrentFile() {
    const editor = atom.workspace.getActivePaneItem();

    return editor.buffer.file.path;
  },

  consumeStatusBar(statusBar) {
    this.statusBarTile = statusBar.addRightTile({
      item: this.statusView.getElement(),
      priority: 100
    });

    this.statusView.hide(); // do not show till the text editor will be active
  },

  onChangeActivePane(item) {
    if (!atom.workspace.isTextEditor(item) || this.config.listHooks(this.getCurrentFile()).length === 0) {
      this.statusView.hide();
    } else {
      this.statusView.show();
    }
  },

  onToggleHooksList() {
    if (!this.hooksListView) {
      this.hooksListView = new HooksListView({
        listHooks: () => this.config.listHooks(this.getCurrentFile()),
        runCommand: command => this.processExecutionResult(this.runner.runCommand(this.getCurrentFile(), command))
      });
    }

    this.hooksListView.toggle();
  },

  onSaveFile(filePath) {
    this.statusView.updateState('loading');

    this.processExecutionResult(this.runner.run(filePath, 'onSave'));
  },

  processExecutionResult(result) {
    return result.then(() => this.statusView.updateState('success')).catch(error => {
      this.statusView.updateState('fail');
      this.notifyError('Error executing onSave scripts', error);
    });
  },

  notifyError(message, detail) {
    atom.notifications.addError(message, {
      detail: typeof detail === 'object' ? JSON.stringify(detail, null, 2) : detail,
      dismissable: true
    });
  },

  deactivate() {
    this.subscriptions.dispose();
    this.statusBarTile.destroy();
    this.statusView.destroy();

    if (this.hooksListView) {
      this.hooksListView.destroy();
    }

    this.subscriptions = null;
    this.statusBarTile = null;
    this.hooksListView = null;
    this.statusView = null;
    this.config = null;
    this.runner = null;
  }
};