import {pipeline, Tensor} from '@xenova/transformers';
import type {APIRoute} from 'astro';
import fs from 'fs';

import {type Route, routes} from '../../data/routes';

console.group('Embedding routes');
console.log('Loading model...');
const embedder =
    await pipeline('feature-extraction', 'Xenova/nomic-embed-text-v1');
console.log('Model loaded');
console.log('Embedding routes...');
export const embeddings = JSON.stringify(await embedRoutes(routes, ''));
console.log('Routes embedded');
console.groupEnd();

export type embedding_entry = {
  name: string;
  path: string;
  vector: Tensor;
};

async function embedRoutes(r: Route[], parent: string):
    Promise<embedding_entry[]> {
  const embeds = [];
  for (const route of r) {
    const folder = parent + route.url;
    const path = './src/pages/' + folder;
    const files = fs.readdirSync(path).filter(
        f => f.split('/').reverse()[0].match(/index\.(html|md|astro)/gm));
    const data = fs.readFileSync(path + files[0], 'utf-8');
    embeds.push({
      name: route.name,
      path: folder,
      vector: await embedder(data, {pooling: 'mean', normalize: true})
    });
    if (route.children) {
      embeds.push(...await embedRoutes(route.children, folder));
    }
  }
  return embeds;
}
