import type {APIRoute} from 'astro';

import {apodData} from './apod';

export const prerender = true;

export const GET: APIRoute = () => {
  return new Response(
      JSON.stringify(apodData.length),
      {headers: {'Content-Type': 'application/json'}});
}
