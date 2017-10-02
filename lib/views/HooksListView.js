'use babel';
// @flow

import SelectListView from 'atom-select-list';

export default class HooksListView {
  listHooks: *;
  runCommand: *;
  listView: SelectListView;
  panel: *;

  constructor({
    listHooks,
    runCommand
  }: {
    listHooks: Function,
    runCommand: string => Promise<void>
  }) {
    this.listHooks = listHooks;
    this.runCommand = runCommand;
  }

  toggle() {
    if (!this.listView) {
      this.listView = new SelectListView({
        items: [],
        elementForItem: item => {
          const li = document.createElement('li');
          li.textContent = `${item.name}: ${item.command}`;
          return li;
        },
        didConfirmSelection: item => {
          this.runCommand(item.command);
          this.destroyPanel();
        },
        didCancelSelection: () => {
          this.destroyPanel();
        }
      });
    }

    this.listView.update({
      items: this.listHooks()
    });

    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({
        item: this.listView.element
      });
    }

    this.listView.focus();
    this.listView.reset();
  }

  destroyPanel() {
    if (this.panel) {
      this.panel.destroy();
      this.panel = null;
    }
  }

  destroy() {
    if (this.listView) {
      this.listView.destroy();
      this.listView = null;
    }

    this.destroyPanel();
  }
}
