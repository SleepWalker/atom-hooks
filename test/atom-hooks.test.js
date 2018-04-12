'use babel';
// @flow
import atomHooks from '../lib/atom-hooks';

describe('#getCurrentFile()', () => {
  beforeEach(() => {
    global.atom = {
      workspace: {
        getActivePaneItem: jest.fn()
      }
    };
  });

  afterEach(() => {
    delete global.atom;
  });

  it('should return file path', () => {
    const expectedPath = '/foo/bar.js';
    atom.workspace.getActivePaneItem.mockReturnValue({
      getPath: () => expectedPath
    });

    const result = atomHooks.getCurrentFile();

    expect(result).toBe(expectedPath);
  });

  it('should return null if no editor', () => {
    const result = atomHooks.getCurrentFile();

    expect(result).toBe(null);
  });
});

describe('#onChangeActivePane()', () => {
  let listHooks;
  let statusView;
  let getCurrentFile;

  beforeEach(() => {
    getCurrentFile = jest.spyOn(atomHooks, 'getCurrentFile');
    listHooks = jest.fn();
    statusView = {
      show: jest.fn(),
      hide: jest.fn()
    };

    atomHooks.statusView = (statusView: any);
    atomHooks.config = ({
      listHooks
    }: any);
  });

  afterEach(() => {
    getCurrentFile.mockRestore();
    atomHooks.statusView = null;
    atomHooks.config = null;
  });

  it('should show status view', () => {
    const expectedPath = '/foo/bar.js';

    getCurrentFile.mockReturnValue(expectedPath);
    listHooks.mockReturnValue({ length: 1 });

    atomHooks.onChangeActivePane();

    expect(getCurrentFile).toBeCalled();
    expect(listHooks.mock.calls).toEqual([[expectedPath]]);
    expect(statusView.show).toBeCalled();
  });

  it('should hide status view if no file', () => {
    getCurrentFile.mockReturnValue(null);
    listHooks.mockReturnValue({ length: 1 });

    atomHooks.onChangeActivePane();

    expect(getCurrentFile).toBeCalled();
    expect(listHooks).not.toBeCalled();
    expect(statusView.hide).toBeCalled();
  });

  it('should hide status view if no hooks', () => {
    const expectedPath = '/foo/bar.js';

    getCurrentFile.mockReturnValue(expectedPath);
    listHooks.mockReturnValue({ length: 0 });

    atomHooks.onChangeActivePane();

    expect(getCurrentFile).toBeCalled();
    expect(listHooks.mock.calls).toEqual([[expectedPath]]);
    expect(statusView.hide).toBeCalled();
  });
});
