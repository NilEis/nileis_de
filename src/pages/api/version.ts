import type {APIRoute} from 'astro';
import childProcess from 'child_process';

import type {VersionResult} from './types';

const version: VersionResult = {
  hash: childProcess.execSync('git rev-parse --short HEAD').toString().trim(),
  name: childProcess.execSync('git log -1 --oneline')
            .toString()
            .split(' ')
            .slice(1)
            .join(' ')
            .trim()
};

export const GET: APIRoute = ({params, request}) => {
  const headers: Headers = new Headers();
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(version), {headers: headers});
}