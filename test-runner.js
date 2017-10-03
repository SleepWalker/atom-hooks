'use babel';

import { exec } from 'child_process';

export default function runTests({ logFile }) {
  if (logFile) {
    logFile = ` --outputFile='${logFile}'`;
  } else {
    logFile = '';
  }

  return new Promise(resolve => {
    exec(
      'npm t --silent -- --ci --json' + logFile,
      { cwd: __dirname },
      error => {
        if (error) {
          console.warn(error);
          resolve(1);
        } else {
          resolve(0);
        }
      }
    );
  });
}
