import type {APIRoute} from 'astro';

const types = ['text', 'json', 'html'] as const;
const values = ['ping', 'pong'] as const;

export type pp_t = (typeof values)[number];
export type ct_t = (typeof types)[number];

export function getStaticPaths() {
  return types.flatMap(
      v => values.map(value => ({params: {ping_or_pong: value, type: v}})));
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