import type {APIRoute} from 'astro';

export type VersionResult = {
  hash: string,
  name: string
};

// default GET handler
export const GET: APIRoute = ({params, request}) => {
  return new Response(null, {status: 204});
}
export const prerender = true;