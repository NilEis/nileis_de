import {pipeline, Tensor} from '@xenova/transformers';
import type {APIRoute} from 'astro';
import fs from 'fs';
import path from 'path';

import {type Route, routes} from '../../data/routes';

console.group('Embedding routes');
console.log('Loading model...');
const embedder =
    await pipeline('feature-extraction', 'Xenova/nomic-embed-text-v1');
console.log('Model loaded');
console.log('Embedding routes...');
const embeddings = await embedRoutes(routes, '');
console.log('Routes embedded');
console.groupEnd();

export const GET: APIRoute =
    () => {
      const em = embeddings.map(
          e => ({name: e.name, path: e.path, vector: [...e.vector.data]}));
      const json = JSON.stringify(em);
      return new Response(json);
    }


type embedding_entry = {
  name: string; path: string; vector: Tensor;
};

async function embedRoutes(
    r: Route[], parent: string): Promise<embedding_entry[]> {
  const embeds = [];
  for (const route of r) {
    const folder = parent + route.url;
    if (route.Description) {
      const data = `${route.name}: ${route.Description}`;
      embeds.push({
        name: route.name,
        path: folder,
        vector: await embedder(
            'search_document: ' + data, {pooling: 'mean', normalize: true})
      });
    }
    if (route.children) {
      embeds.push(...await embedRoutes(route.children, folder));
    }
  }
  return embeds;
}
