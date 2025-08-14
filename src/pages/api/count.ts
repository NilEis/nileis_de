import type {APIRoute} from 'astro';

import {turso} from '../../turso';

export const prerender = false;


export const POST: APIRoute = async (req) => {
  await Count();
  return new Response(null, {status: 200});
}

export const GET: APIRoute = async () => {
  const result = await turso.execute('SELECT count FROM visits WHERE id = 0');
  const count = result.rows[0][0] as number;
  return new Response(`${count}`, {
    headers: {'Content-Type': 'text/plain'}
  });
};

export async function Count() {
  await turso.execute('UPDATE visits SET count = count + 1');
}
