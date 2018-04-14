'use babel';

import _JSON$stringify from 'babel-runtime/core-js/json/stringify';

import { CompositeDisposable } from 'atom';
import HooksListView from './views/HooksListView';
import StatusView from './views/StatusView';
import Config from './Config';
import Runner from './Runner';

class AtomHooks {

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

    // this handler for modal hooks list
    this.subscriptions.add(atom.commands.add('atom-workspace', 'atom-hooks:show', event => {
      const filePath = event.target.getAttribute('data-path');

      this.onToggleHooksList(filePath);
    }));

    // reload our config when it is modified
    this.subscriptions.add(atom.config.observe('atom-hooks', () => this.readConfig()));

    // check for available hooks every time user switches tab
    this.subscriptions.add(atom.workspace.getCenter().observeActivePaneItem(() => this.onChangeActivePane()));

    // onSave hook
    this.subscriptions.add(atom.workspace.observeTextEditors(textEditor => this.subscriptions.add(textEditor.onDidSave(event => this.onSaveFile(event.path)))));
  }

  readConfig() {
    this.config.setConfig({
      scripts: atom.config.get('atom-hooks.scripts') || {},
      hooks: atom.config.get('atom-hooks.hooks') || {}
    });
  }

  getCurrentFile() {
    const paneItem = atom.workspace.getCenter().getActivePaneItem();

    if (paneItem && paneItem.getPath) {
      return paneItem.getPath();
    }

    return null;
  }

  consumeStatusBar(statusBar) {
    this.statusBarTile = statusBar.addRightTile({
      item: this.statusView.getElement(),
      priority: 100
    });

    this.statusView.hide(); // do not show till the text editor will be active
  }

  onChangeActivePane() {
    const filePath = this.getCurrentFile();

    if (filePath && this.config.listHooks(filePath).length) {
      this.statusView.show();
    } else {
      this.statusView.hide();
    }
  }

  onToggleHooksList(filePath) {
    if (!this.hooksListView) {
      this.hooksListView = new HooksListView({
        runCommand: (filePath, command) => this.processExecutionResult(this.runner.runCommand(filePath, command))
      });
    }

    filePath = filePath || this.getCurrentFile();

    if (filePath) {
      this.hooksListView.show(filePath, this.config.listHooks(filePath));
    }
  }

  onSaveFile(filePath) {
    this.processExecutionResult(this.runner.runHook(filePath, 'onSave'));
  }

  processExecutionResult(result) {
    this.statusView.updateState('loading');

    return result.then(() => this.statusView.updateState('success')).catch(error => {
      this.statusView.updateState('fail');
      this.notifyError('Error executing onSave scripts', error);
    });
  }

  notifyError(message, detail) {
    atom.notifications.addError(message, {
      detail: typeof detail === 'object' ? _JSON$stringify(detail, null, 2) : detail,
      dismissable: true
    });
  }

  deactivate() {
    this.subscriptions.dispose();
    this.statusBarTile.destroy();
    this.statusView.destroy();

    if (this.hooksListView) {
      this.hooksListView.destroy();
    }

    this.subscriptions = null;
    this.statusBarTile = null;
    // $FlowFixMe
    this.hooksListView = null;
    // $FlowFixMe
    this.statusView = null;
    // $FlowFixMe
    this.config = null;
    // $FlowFixMe
    this.runner = null;
  }
}

export default new AtomHooks();