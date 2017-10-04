'use babel';

import { runCLI } from 'jest-cli';

export default function runTests({ logFile, testPaths }) {
  return runCLI(
    {
      cache: false, // without this it will fail on oniguruma package (https://github.com/facebook/jest/issues/3552)
      _: testPaths,
      outputFile: logFile
    },
    [process.cwd()]
  ).then(resp => (resp.results.success ? 0 : 1));
}
