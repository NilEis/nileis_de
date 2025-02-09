import type { APIRoute } from "astro";
import { apodData, encodeApod } from "./apod.json";


export const GET: APIRoute = ({ params }) =>
{
  const id = Number.parseInt (params.id as string);
  return new Response (JSON.stringify (encodeApod (JSON.stringify (apodData[id]))))
}

export function getStaticPaths()
{
  const paths = [];
  for(let i = 0; i < apodData.length; i++)
  {
    paths.push ({params: {id: `${i}`}});
  }
  return paths;
}
