'use babel';

import { runCLI } from 'jest-cli';

export default function runTests({ logFile, testPaths }) {
  return runCLI(
    {
      // force workers > 1 and disabling cache
      // without this it will fail on oniguruma package
      // @see https://github.com/facebook/jest/issues/3552
      cache: false,
      maxWorkers: 2,
      _: testPaths,
      outputFile: logFile
    },
    [process.cwd()]
  ).then(resp => (resp.results.success ? 0 : 1));
}
