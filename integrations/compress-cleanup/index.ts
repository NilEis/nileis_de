import type {AstroIntegration} from 'astro';
import type {PathLike} from 'node:fs';
import {readdir, stat, unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

export default function(): AstroIntegration {
  return {
    name: 'astro-compressor-cleanup',
    hooks: {
      'astro:build:done': async ({dir, logger}) => {
        const fileExists = async (path: PathLike) =>
            !!(await stat(path).catch(e => false));
        const path = fileURLToPath(dir);
        const entries =
            await readdir(dir, {withFileTypes: true, recursive: true});
        const filteredEntries = entries.filter(
            (entry) => entry.isFile() &&
                (entry.name.endsWith('.gz') || entry.name.endsWith('.br')));
        let i = 0;
        for (const entry of filteredEntries) {
          if (!fileExists(entry.name)) {
            continue;
          }
          const name = entry.name.replace(/\.gz$|\.br$/, '');
          logger.info(`Removing uncompressed file: ${name}`);
          try {
            await unlink(`${path}/${name}`);
            i++;
          } catch (error) {
            logger.error(`Failed to remove file ${name}: ${error}`);
          }
        }
        logger.info(
            `Compression cleanup finished (${i}/${filteredEntries.length})\n`);
      },
    },
  };
}