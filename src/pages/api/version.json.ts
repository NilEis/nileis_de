import type {APIRoute} from 'astro';
import childProcess from 'child_process';

import type {VersionResult} from './types';

export const version: VersionResult = {
  hash: childProcess.execSync('git rev-parse --short HEAD').toString().trim(),
  name: childProcess.execSync('git log -1 --oneline')
            .toString()
            .split(' ')
            .slice(1)
            .join(' ')
            .trim()
};

export const GET: APIRoute = ({params, request}) => {
  return new Response(JSON.stringify(version));
}