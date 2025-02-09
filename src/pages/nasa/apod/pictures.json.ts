import type { APIRoute } from "astro";
import { apodData } from "./apod.json";

export const GET:APIRoute = () =>
{
  return new Response (JSON.stringify (apodData.length));
}
