'use babel';

import SelectListView from 'atom-select-list';

export default class HooksListView {

  constructor({ runCommand }) {
    this.runCommand = runCommand;
  }

  show(filePath, hooks) {
    if (!this.listView) {
      this.listView = new SelectListView({
        items: [],
        itemsClassList: ['atom-hooks-list-item'],
        elementForItem: item => {
          const li = document.createElement('li');
          li.classList.add('two-lines');

          const primaryLine = document.createElement('div');
          primaryLine.textContent = `${item.name}: ${item.command}`;
          primaryLine.classList.add('primary-line');

          const secondaryLine = document.createElement('div');
          secondaryLine.textContent = `${item.interpolated}`;
          secondaryLine.classList.add('secondary-line');

          li.appendChild(primaryLine);
          li.appendChild(secondaryLine);

          return li;
        },
        didConfirmSelection: item => {
          this.runCommand(this.filePath, item.command);
          this.destroyPanel();
        },
        didCancelSelection: () => {
          this.destroyPanel();
        }
      });
    }

    this.filePath = filePath;
    this.listView.update({
      infoMessage: filePath,
      items: hooks
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