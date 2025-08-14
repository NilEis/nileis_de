import type {APIRoute} from 'astro';

export const request_types = ['text', 'json', 'html'] as const;
export const request_values = ['ping', 'pong'] as const;

export type pp_t = (typeof request_values)[number];
export type ct_t = (typeof request_types)[number];

export function getStaticPaths() {
  return request_types.flatMap(
      v => request_values.map(value => ({params: {ping_or_pong: value, type: v}})));
}

export const GET: APIRoute =
    async ({params}) => {
  const {ping_or_pong, type} = params;
  return ping_pong(ping_or_pong as pp_t, type as ct_t);
}

export function ping_pong(ping_or_pong: pp_t, type: ct_t):
    Response {
      let pp: string = ping_or_pong === 'ping' ? 'pong' : 'ping';
      switch (type) {
        case 'json':
          return new Response(
              JSON.stringify({[pp]: true}),
              {headers: {'Content-Type': 'application/json'}});
        case 'text':
          return new Response(pp, {headers: {'Content-Type': 'text/plain'}});
        case 'html':
          return new Response(
              `<p>${pp}</p>`, {headers: {'Content-Type': 'text/html'}});
        default:
          return new Response(pp, {headers: {'Content-Type': 'text/plain'}});
      }
    }