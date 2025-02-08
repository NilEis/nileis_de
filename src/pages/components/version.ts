import childProcess from 'child_process';

export const version: {
    hash:string,
    name:string
} = {
    hash: childProcess.execSync('git rev-parse --short HEAD').toString().trim(),
    name: childProcess.execSync('git log -1 --oneline')
              .toString()
              .split(' ')
              .slice(1)
              .join(' ')
              .trim()
  };