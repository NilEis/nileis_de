import type {APIRoute} from 'astro';

import {ping_pong, type pp_t} from './[types]/[ping_or_pong]';

export function getStaticPaths() {
  const values: string[] = ['ping', 'pong'];
  return values.map(value => ({params: {ping_or_pong: value}}));
}

export const GET: APIRoute = async ({params}) => {
  const {ping_or_pong} = params;
  return ping_pong(ping_or_pong as pp_t, 'text');
}