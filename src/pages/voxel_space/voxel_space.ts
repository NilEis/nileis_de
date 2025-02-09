import type {APIRoute} from "astro";
import Stats from "stats.js";

import {loadMap} from "./maps";

let current: number = 0;

interface HeightMap
{
  values: Array<Float32Array>;
  width: number;
  height: number;
}

interface Coord
{
  x: number;
  y: number;
}
;

interface GameState
{
  stats: Stats;
  pos: Coord;
  phi: number;
  height: number;
  horizon: number;
  scale_height: number;
  distance: number;
  keys: { [key: string]: boolean };
  mouse: {
    pos: Coord; up: boolean; down: boolean; move: boolean; left: boolean;
    right: boolean;
    click: boolean;
  };
}
;

interface ImageOverlay
{
  ctx: { color: CanvasRenderingContext2D; height: CanvasRenderingContext2D };
  buffer: { img: ImageData; data: Uint32Array };
}
;

export interface VoxelSpaceMap
{
  color: { image: HTMLImageElement; data: ImageData };
  height: { image: HTMLImageElement; data: HeightMap };
  data: ImageData;
}
;

export interface VoxelSpace
{
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  rect: DOMRect;
  buffer: { img: ImageData; data: Uint32Array };
  map: VoxelSpaceMap;
  state: GameState;
  maps: ImageOverlay;
}
;

export function VoxelSpaceInit(
  canvas: { elem: HTMLCanvasElement; ctx: CanvasRenderingContext2D },
  map: VoxelSpaceMap,
  maps_ctx:
  { color: CanvasRenderingContext2D; height: CanvasRenderingContext2D }
):
  VoxelSpace
{
  const res: VoxelSpace = {
    canvas: canvas.elem,
    ctx: canvas.ctx,
    rect: canvas.elem.getBoundingClientRect (),
    buffer: {
      img: canvas.ctx.createImageData (canvas.elem.width, canvas.elem.height),
      data: (new Uint32Array)
    },
    map: map,
    state: {
      stats: (new Stats),
      pos: {x: 500, y: 500},
      phi: Math.PI,
      height: 50,
      horizon: canvas.elem.height / 2,
      scale_height: 200,
      distance: 512,
      keys: {},
      mouse: {
        pos: {x: 0, y: 0},
        up: false,
        down: false,
        move: false,
        left: false,
        right: false,
        click: false
      },
    },
    maps: {
      ctx: {color: maps_ctx.color, height: maps_ctx.height},
      buffer: {
        img: maps_ctx.height.createImageData (maps_ctx.height.canvas.width, maps_ctx.height.canvas.height),
        data: (new Uint32Array)
      },
    }
  };
  res.state.stats.showPanel (0);
  document.body.appendChild (res.state.stats.dom);
  canvas.elem.style.backgroundColor = "black";
  res.ctx.imageSmoothingEnabled = false;
  res.canvas.style.imageRendering = "crisp-edges";
  window.onresize = () =>
  {
    const parent = res.canvas.parentNode as HTMLDivElement;
    const new_size = Math.min (parent.clientWidth, parent.clientHeight);
    res.canvas.width = new_size;
    res.canvas.height = new_size;
    res.state.horizon = res.canvas.height / 2;
    res.buffer.img
        = res.ctx.createImageData (res.canvas.width, res.canvas.height);
    res.buffer.data = (new Uint32Array);
    res.rect = res.canvas.getBoundingClientRect ();
    for (const elem of Object.values (res.maps.ctx))
    {
      elem.canvas.width = elem.canvas.parentElement!.clientWidth;
      elem.canvas.height = elem.canvas.parentElement!.clientHeight;
    }
    res.maps.buffer.img = res.maps.ctx.height.createImageData (res.maps.ctx.height.canvas.width, res.maps.ctx.height.canvas.height);
  };
  window.onresize (new UIEvent ("resize"));

  res.canvas.onmousedown = (e: MouseEvent) =>
  {
    const x = e.clientX - res.rect.left;
    const y = e.clientY - res.rect.top;
    handleMouse (res, {click: true, x: x, y: y})
  };
  res.canvas.onmousemove = (e: MouseEvent) =>
  {
    const x = e.clientX - res.rect.left;
    const y = e.clientY - res.rect.top;
    handleMouse (res, {click: undefined, x: x, y: y})
  };
  res.canvas.onmouseup = (e: MouseEvent) =>
  {
    const x = e.clientX - res.rect.left;
    const y = e.clientY - res.rect.top;
    handleMouse (res, {click: false, x: x, y: y})
  };

  res.canvas.ontouchstart = (e: TouchEvent) =>
  {
    const x = e.touches[0].clientX - res.rect.left;
    const y = e.touches[0].clientY - res.rect.top;
    handleMouse (res, {click: true, x: x, y: y})
  };
  res.canvas.ontouchmove = (e: TouchEvent) =>
  {
    const x = e.touches[0].clientX - res.rect.left;
    const y = e.touches[0].clientY - res.rect.top;
    handleMouse (res, {click: undefined, x: x, y: y})
  };
  res.canvas.ontouchend = (e: TouchEvent) =>
  {
    const x = e.touches[0].clientX - res.rect.left;
    const y = e.touches[0].clientY - res.rect.top;
    handleMouse (res, {click: false, x: x, y: y})
  };
  return res;
}

export function main(): void
{
  cancelAnimationFrame (current);
  init ().then (loop);
}
function loop(state: VoxelSpace)
{
  state.state.stats.begin ();
  tick (state);
  state.state.stats.end ();
  current = requestAnimationFrame (() => loop (state));
}

export async function init(): Promise<VoxelSpace>
{
  const canvas: HTMLCanvasElement
      = document.getElementById ("canvas") as HTMLCanvasElement;
  const ctx: CanvasRenderingContext2D
      = canvas.getContext ("2d") as CanvasRenderingContext2D;
  const map: VoxelSpaceMap = await loadMap ();
  const color_map_view
      = document.getElementById ("color_map") as HTMLImageElement;
  const height_map_view
      = document.getElementById ("height_map") as HTMLImageElement;
  color_map_view.src = map.color.image.src;
  height_map_view.src = map.height.image.src;
  const maps_ctx = {
    color: (document.getElementById ("color_map_canvas") as HTMLCanvasElement)
      .getContext ("2d") as CanvasRenderingContext2D,
    height: (document.getElementById ("height_map_canvas") as HTMLCanvasElement)
      .getContext ("2d") as CanvasRenderingContext2D
  };
  const vs: VoxelSpace
      = VoxelSpaceInit ({elem: canvas, ctx: ctx}, map, maps_ctx);
  (document.getElementById ("loadBtn") as HTMLButtonElement).onclick = () =>
  {
    main ();
  };
  (document.getElementById ("resetBtn") as HTMLButtonElement).onclick = () =>
  {
    (document.getElementById ("color_input") as HTMLInputElement).value = "";
    (document.getElementById ("height_input") as HTMLInputElement).value = "";
    main ();
  };
  document.onkeydown = (e: KeyboardEvent) =>
  {
    vs.state.keys[e.key] = true;
  };
  document.onkeyup = (e: KeyboardEvent) =>
  {
    vs.state.keys[e.key] = false;
  };
  return vs;
}

export function tick(state: VoxelSpace)
{
  if (state.state.keys["w"] || state.state.mouse.move)
  {
    moveForward (state);
  }
  if (state.state.keys["s"])
  {
    moveBackward (state);
  }
  if (state.state.keys["a"] || state.state.keys["ArrowLeft"]
    || state.state.mouse.left)
  {
    turnLeft (state, state.state.mouse.click ? 0.1 : 1.0);
  }
  if (state.state.keys["d"] || state.state.keys["ArrowRight"]
    || state.state.mouse.right)
  {
    turnRight (state, state.state.mouse.click ? 0.1 : 1.0);
  }
  if (state.state.keys["e"])
  {
    ascend (state);
  }
  if (state.state.keys["q"])
  {
    descend (state);
  }
  if (state.state.keys["ArrowUp"] || state.state.mouse.up)
  {
    lookUp (state);
    if (state.state.mouse.click)
    {
      ascend (state, 0.5);
    }
  }
  if (state.state.keys["ArrowDown"] || state.state.mouse.down)
  {
    lookDown (state);
    if (state.state.mouse.click)
    {
      descend (state, 0.5);
    }
  }
  state.buffer.data = new Uint32Array (state.buffer.img.data);
  for (let i = 0; i < state.buffer.data.length; i++)
  {
    state.buffer.data[i] = state.buffer.data[i] * 0.9;
  }
  state.maps.buffer.data = new Uint32Array (state.maps.buffer.img.data);
  for (let i = 0; i < state.maps.buffer.data.length; i++)
  {
    state.maps.buffer.data[i] = 0;
  }

  render (state);

  state.buffer.img.data.set (state.buffer.data);
  state.ctx.putImageData (state.buffer.img, 0, 0);

  state.maps.buffer.img.data.set (state.maps.buffer.data);
  state.maps.ctx.height.putImageData (state.maps.buffer.img, 0, 0);
  state.maps.ctx.color.putImageData (state.maps.buffer.img, 0, 0);
}

function lookDown(state: VoxelSpace)
{
  state.state.horizon -= 5;
  if (state.state.horizon < 0)
  {
    state.state.horizon = 0;
  }
}

function lookUp(state: VoxelSpace)
{
  state.state.horizon += 5;
  if (state.state.horizon >= state.canvas.height)
  {
    state.state.horizon = state.canvas.height - 1;
  }
}

function descend(state: VoxelSpace, prescaler: number = 1.0)
{
  state.state.height -= 1 * prescaler;
  preventUnderground (state, {x: -Math.cos (state.state.phi), y: -Math.sin (state.state.phi)});
}

function ascend(state: VoxelSpace, prescaler: number = 1.0)
{
  state.state.height += 1 * prescaler;
  preventUnderground (state, {x: -Math.cos (state.state.phi), y: -Math.sin (state.state.phi)});
}

function turnRight(state: VoxelSpace, prescaler: number = 1.0)
{
  state.state.phi -= 0.1 * prescaler;
  console.log (state.state.phi);
}

function turnLeft(state: VoxelSpace, prescaler: number = 1.0)
{
  state.state.phi += 0.1 * prescaler;
  console.log (state.state.phi);
}

function moveBackward(state: VoxelSpace)
{
  const offset:
  Coord = {x: -Math.sin (state.state.phi), y: -Math.cos (state.state.phi)};
  state.state.pos.x -= offset.x;
  state.state.pos.y -= offset.y;
  preventUnderground (state, offset);
}

function moveForward(state: VoxelSpace)
{
  const offset:
  Coord = {x: -Math.sin (state.state.phi), y: -Math.cos (state.state.phi)};
  state.state.pos.x += offset.x;
  state.state.pos.y += offset.y;
  preventUnderground (state, offset);
}

function drawLine(state: VoxelSpace, start: Coord, end: Coord, map_pos: Coord)
{
  const mapx = (map_pos.x / state.map.color.data.width)
    * state.maps.ctx.color.canvas.width;
  const mapy = (map_pos.y / state.map.color.data.height)
    * state.maps.ctx.color.canvas.height;
  const map_index = (Math.floor (mapy) * state.maps.ctx.color.canvas.width
    + Math.floor (mapx))
  * 4;
  state.maps.buffer.data[map_index + 0] = 255;
  state.maps.buffer.data[map_index + 1] = 255;
  state.maps.buffer.data[map_index + 2] = 255;
  state.maps.buffer.data[map_index + 3] = 255;

  if (start.y < end.y)
  {
    return;
  }
  if (end.y < 0)
  {
    end.y = 0;
  }
  const r
      = state.map.color.data
        .data[((map_pos.y * state.map.color.data.width + map_pos.x) * 4) + 0];
  const g
      = state.map.color.data
        .data[((map_pos.y * state.map.color.data.width + map_pos.x) * 4) + 1];
  const b
      = state.map.color.data
        .data[((map_pos.y * state.map.color.data.width + map_pos.x) * 4) + 2];
  for (let y = Math.floor (start.y); y >= Math.floor (end.y); y--)
  {
    const index = (y * state.canvas.width + start.x) * 4;
    state.buffer.data[index + 0] = r;
    state.buffer.data[index + 1] = g;
    state.buffer.data[index + 2] = b;
    state.buffer.data[index + 3] = 255;
  }
}

function render(state: VoxelSpace)
{
  const frameWidth: number = state.buffer.img.width;
  const frameHeight: number = state.buffer.img.height;

  // precalculate viewing angle parameters
  const sinPhi = Math.sin (state.state.phi);
  const cosPhi = Math.cos (state.state.phi);

  const hbuffer = new Float32Array (frameWidth).fill (frameHeight);

  let ddz = 0.1;
  let dz = 0.01;
  let z = 1.0;
  while (z < state.state.distance)
  {
    const pleft: Coord = {
      x: (-cosPhi * z - sinPhi * z) + state.state.pos.x,
      y: (sinPhi * z - cosPhi * z) + state.state.pos.y
    };
    const pright: Coord = {
      x: (cosPhi * z - sinPhi * z) + state.state.pos.x,
      y: (-sinPhi * z - cosPhi * z) + state.state.pos.y
    };

    const dx = (pright.x - pleft.x) / frameWidth;
    const dy = (pright.y - pleft.y) / frameWidth;

    for (let i = 0; i < frameWidth; i++)
    {
      const map_pos: Coord = {
        x: (Math.floor (pleft.x)
          + (state.map.height.data.width
            * (Math.abs (Math.floor (pleft.x / state.map.height.data.width))
              + 1)))
            % state.map.height.data.width,
        y: (Math.floor (pleft.y)
          + (state.map.height.data.height
            * (Math.abs (Math.floor (pleft.y / state.map.height.data.height))
              + 1)))
            % state.map.height.data.height,
      };
      const height_on_screen = getHeight (state, map_pos, z);
      drawLine (
        state, {x: i, y: hbuffer[i]}, {x: i, y: height_on_screen},
        {x: map_pos.x, y: map_pos.y}
      );
      if (height_on_screen < hbuffer[i])
      {
        hbuffer[i] = height_on_screen;
      }
      pleft.x = pleft.x + dx;
      pleft.y = pleft.y + dy;
    }
    z += dz;
    dz += ddz;
    ddz += ddz * 0.01;
  }
}
function preventUnderground(state: VoxelSpace, offset: Coord)
{
  const map_height = state.map.height.data.values[(Math.floor (state.state.pos.y+(offset.y))
    + (state.map.height.data.height * 2))
  % state.map.height.data.height][(Math.floor (state.state.pos.x+(offset.x)) + (state.map.height.data.width * 2))
    % state.map.height.data.width];
  const DISTANCE_TO_GROUND = 2;
  if (map_height + DISTANCE_TO_GROUND >= state.state.height)
  {
    state.state.height = map_height + DISTANCE_TO_GROUND;
  }
}

function getHeight(state: VoxelSpace, map_pos: Coord, z: number)
{
  return (state.state.height
    - state.map.height.data.values[map_pos.y][map_pos.x])
  / z * state.state.scale_height
  + state.state.horizon;
}

function handleMouse(state: VoxelSpace, e: { click: boolean|undefined; x: number; y: number })
{
  if (e.click !== undefined && e.click)
  {
    state.state.mouse.click = true;
  }
  else if (e.click !== undefined && !e.click)
  {
    state.state.mouse.click = false;
  }
  if (state.state.mouse.click)
  {
    state.state.mouse.click = true;
    state.state.mouse.move = true;
    if (e.x <= state.canvas.width * 0.25)
    {
      state.state.mouse.left = true;
      state.state.mouse.right = false;
    }
    else if (e.x >= state.canvas.width * 0.75)
    {
      state.state.mouse.left = false;
      state.state.mouse.right = true;
    }
    else
    {
      state.state.mouse.left = false;
      state.state.mouse.right = false;
    }

    if (e.y <= state.canvas.height * 0.25)
    {
      state.state.mouse.up = true;
      state.state.mouse.down = false;
    }
    else if (e.y >= state.canvas.height * 0.75)
    {
      state.state.mouse.up = false;
      state.state.mouse.down = true;
    }
    else
    {
      state.state.mouse.up = false;
      state.state.mouse.down = false;
    }
  }
  else if (!state.state.mouse.click)
  {
    state.state.mouse.down = false;
    state.state.mouse.move = false;
    state.state.mouse.left = false;
    state.state.mouse.right = false;
    state.state.mouse.up = false;
    state.state.mouse.down = false;
  }
  state.state.mouse.pos.x = e.x;
  state.state.mouse.pos.y = e.y;
}

export const GET: APIRoute = ({params, request}) =>
{
  return new Response (null, {status: 204});
}
