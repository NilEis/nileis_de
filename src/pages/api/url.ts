import type { APIRoute } from "astro";

export const GET: APIRoute = async (params) => {
  return new Response(`${params.url.origin}`, {
    headers: {'Content-Type': 'text/plain'}
  });
};