import type {APIRoute} from "astro";

import map_1_color_meta from "./images/_1_color.png";
import map_1_height_meta from "./images/_1_height.png";
import type {VoxelSpaceMap} from "./voxel_space";

export async function loadMap1Color(size: { w: number; h: number }|null = null):
Promise<HTMLImageElement>
{
  const MAP_1_COLOR: HTMLImageElement = new Image (
    map_1_color_meta.width,
    map_1_color_meta.height,
  );
  await new Promise ((resolve) =>
  {
    MAP_1_COLOR.src = map_1_color_meta.src;
    MAP_1_COLOR.onload = () => resolve (MAP_1_COLOR);
  });
  if (size == null)
  {
    return new Promise ((resolve) => resolve (MAP_1_COLOR));
  }
  return new Promise ((resolve) =>
  {
    const canvas: HTMLCanvasElement = document.createElement ("canvas");
    const ctx: CanvasRenderingContext2D
        = canvas.getContext ("2d") as CanvasRenderingContext2D;
    MAP_1_COLOR.onload = () => resolve (MAP_1_COLOR);
    canvas.width = size.w;
    canvas.height = size.h;
    ctx.drawImage (MAP_1_COLOR, 0, 0, size.w, size.h);
    MAP_1_COLOR.src = canvas.toDataURL ();
  });
}

export async function loadMap1Height(size: { w: number; h: number }|null = null):
Promise<HTMLImageElement>
{
  const MAP_1_HEIGHT: HTMLImageElement = new Image (
    map_1_height_meta.width,
    map_1_height_meta.height,
  );
  await new Promise ((resolve) =>
  {
    MAP_1_HEIGHT.src = map_1_height_meta.src;
    MAP_1_HEIGHT.onload = () => resolve (MAP_1_HEIGHT);
  });
  if (size == null)
  {
    return new Promise ((resolve) => resolve (MAP_1_HEIGHT));
  }
  return new Promise ((resolve) =>
  {
    const canvas: HTMLCanvasElement = document.createElement ("canvas");
    const ctx: CanvasRenderingContext2D
        = canvas.getContext ("2d") as CanvasRenderingContext2D;
    MAP_1_HEIGHT.onload = () => resolve (MAP_1_HEIGHT);
    canvas.width = size.w;
    canvas.height = size.h;
    ctx.drawImage (MAP_1_HEIGHT, 0, 0, size.w, size.h);
    MAP_1_HEIGHT.src = canvas.toDataURL ();
  });
}

export async function loadMap(size: { w: number; h: number }|null = null):
Promise<VoxelSpaceMap>
{
  const colorInput: HTMLInputElement
      = document.getElementById ("color_input") as HTMLInputElement;
  const heightInput: HTMLInputElement
      = document.getElementById ("height_input") as HTMLInputElement;
  let res: VoxelSpaceMap;
  return new Promise (async (resolve) =>
  {
    if (colorInput.files!.length != 0 && heightInput.files!.length != 0)
    {
      const color = (new Image);
      const height = (new Image);
      let loaded: 0|1|2 = 0;

      const color_reader: FileReader = (new FileReader);
      color_reader.onload = (e: ProgressEvent<FileReader>) =>
      {
        color.src = e.target!.result as string;
        loaded++;
      };

      const height_reader: FileReader = (new FileReader);
      height_reader.onload = (e: ProgressEvent<FileReader>) =>
      {
        height.src = e.target!.result as string;
        loaded++;
      };

      color_reader.readAsDataURL (colorInput.files![0]);
      height_reader.readAsDataURL (heightInput.files![0]);

      while (loaded < 2)
      {
        await new Promise ((resolve) => setTimeout (resolve, 1));
      }
      if (size != null)
      {
        const canvas: HTMLCanvasElement = document.createElement ("canvas");
        const ctx: CanvasRenderingContext2D
            = canvas.getContext ("2d") as CanvasRenderingContext2D;
        canvas.width = size.w;
        canvas.height = size.h;
        ctx.drawImage (color, 0, 0, size.w, size.h);
        color.src = canvas.toDataURL ();
        ctx.drawImage (height, 0, 0, size.w, size.h);
        height.src = canvas.toDataURL ();
      }

      await Promise.all ([ color.decode (), height.decode () ]);
      resolve ({
        color: {image: color, data: loadImageData (color)},
        height: {
          image: height,
          data: {
            values: hightMapFromImageData (loadImageData (height)),
            width: height.naturalWidth,
            height: height.naturalHeight
          }
        }
      });
    }
    else
    {
      const color: HTMLImageElement = await loadMap1Color (size);
      const height: HTMLImageElement = await loadMap1Height (size);
      res = {
        color: {image: color, data: loadImageData (color)},
        height: {
          image: height,
          data: {
            values: hightMapFromImageData (loadImageData (height)),
            width: height.naturalWidth,
            height: height.naturalHeight
          }
        }
      };
    }
    resolve (res);
  });
}

function loadImageData(image: HTMLImageElement): ImageData
{
  const canvas: HTMLCanvasElement = document.createElement ("canvas");
  const ctx: CanvasRenderingContext2D
      = canvas.getContext ("2d") as CanvasRenderingContext2D;
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  ctx.drawImage (image, 0, 0);
  return ctx.getImageData (0, 0, image.naturalWidth, image.naturalHeight);
}

function hightMapFromImageData(data: ImageData): Array<Float32Array>
{
  const res: Array<Float32Array> = new Array<Float32Array> (data.height);
  for (let y = 0; y < data.height; y++)
  {
    res[y] = new Float32Array (data.width);
    for (let x = 0; x < data.width; x++)
    {
      res[y][x] = 0;
      res[y][x] += data.data[((y * data.width + x) * 4) + 0];
      res[y][x] += data.data[((y * data.width + x) * 4) + 1];
      res[y][x] += data.data[((y * data.width + x) * 4) + 2];
      res[y][x] /= 3;
    }
  }
  return res;
}

export const GET: APIRoute = async ({params, request}) =>
{
  return new Response (null, {status: 204});
}
