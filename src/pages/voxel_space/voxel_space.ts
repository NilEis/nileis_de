import {MAP_1_COLOR, MAP_1_HEIGHT} from './maps.ts';

let current: number = 0;

interface HeightMap {
  values: Array<Float32Array>;
  width: number;
  height: number;
}

interface Coord {
  x: number;
  y: number
}
;

interface GameState {
  pos: Coord;
  phi: number;
  height: number;
  horizon: number;
  scale_height: number;
  distance: number;
  keys: {[key: string]: boolean};
}
;

export interface VoxelSpaceMap {
  color: {image: HTMLImageElement, data: ImageData};
  height: {image: HTMLImageElement, data: HeightMap};
}
;

export interface VoxelSpace {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  framebuffer: {
    canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D;
    scaling_factor: number;
  };
  map: VoxelSpaceMap;
  state: GameState;
}
;

export function VoxelSpaceInit(
    canvas: {elem: HTMLCanvasElement, ctx: CanvasRenderingContext2D},
    map: VoxelSpaceMap): VoxelSpace {
  const res: VoxelSpace = {
    canvas: canvas.elem,
    ctx: canvas.ctx,
    framebuffer: {
      canvas: document.createElement('canvas'),
      ctx: document.createElement('canvas').getContext('2d') as
          CanvasRenderingContext2D,
      scaling_factor: 1,
    },
    map: map,
    state: {
      pos: {x: 0, y: 0},
      phi: 0,
      height: 50,
      horizon: 120,
      scale_height: 120,
      distance: 300,
      keys: {}
    }
  };
  canvas.elem.style.backgroundColor = 'black';
  res.ctx.imageSmoothingEnabled = false;
  res.canvas.style.imageRendering = 'crisp-edges';
  res.framebuffer.ctx =
      res.framebuffer.canvas.getContext('2d') as CanvasRenderingContext2D;
  document.onresize = () => {
    const parent = res.canvas.parentNode as HTMLDivElement;
    res.canvas.width = parent.clientWidth;
    res.canvas.height = parent.clientHeight;
    res.framebuffer.canvas.width =
        res.canvas.width * res.framebuffer.scaling_factor;
    res.framebuffer.canvas.height =
        res.canvas.height * res.framebuffer.scaling_factor;
  };
  document.onresize(new UIEvent('resize'));
  return res;
}

export function main(): void {
  cancelAnimationFrame(current);
  init().then(loop);
}
function loop(state: VoxelSpace) {
  tick(state);
  current = requestAnimationFrame(() => loop(state));
}

export async function init(): Promise<VoxelSpace> {
  const canvas: HTMLCanvasElement =
      document.getElementById('canvas') as HTMLCanvasElement;
  const ctx: CanvasRenderingContext2D =
      canvas.getContext('2d') as CanvasRenderingContext2D;
  const map: VoxelSpaceMap = await loadMap();
  const color_map_view =
      document.getElementById('color_map') as HTMLImageElement;
  const height_map_view =
      document.getElementById('height_map') as HTMLImageElement;
  color_map_view.src = map.color.image.src;
  height_map_view.src = map.height.image.src;
  const vs: VoxelSpace = VoxelSpaceInit({elem: canvas, ctx: ctx}, map);
  (document.getElementById('loadBtn') as HTMLButtonElement).onclick = () => {
    main();
  };
  (document.getElementById('resetBtn') as HTMLButtonElement).onclick = () => {
    (document.getElementById('color_input') as HTMLInputElement).value = '';
    (document.getElementById('height_input') as HTMLInputElement).value = '';
    main();
  };
  document.onkeydown = (e: KeyboardEvent) => {
    vs.state.keys[e.key] = true;
    e.preventDefault();
  };
  document.onkeyup = (e: KeyboardEvent) => {
    vs.state.keys[e.key] = false;
  };
  return vs;
}

export function tick(state: VoxelSpace) {
  if (state.state.keys['w']) {
    state.state.pos.y -= Math.cos(state.state.phi);
    state.state.pos.x -= Math.sin(state.state.phi);
  }
  if (state.state.keys['s']) {
    state.state.pos.y += Math.cos(state.state.phi);
    state.state.pos.x += Math.sin(state.state.phi);
  }
  if (state.state.keys['a'] || state.state.keys['ArrowLeft']) {
    state.state.phi += 0.1;
  }
  if (state.state.keys['d'] || state.state.keys['ArrowRight']) {
    state.state.phi -= 0.1;
  }
  if (state.state.keys['e']) {
    state.state.height += 1;
  }
  if (state.state.keys['q']) {
    state.state.height -= 1;
  }
  if (state.state.keys['ArrowUp']) {
    state.state.horizon += 5;
  }
  if (state.state.keys['ArrowDown']) {
    state.state.horizon -= 5;
  }
  render(state);
}

async function loadMap(): Promise<VoxelSpaceMap> {
  const colorInput: HTMLInputElement =
      document.getElementById('color_input') as HTMLInputElement;
  const heightInput: HTMLInputElement =
      document.getElementById('height_input') as HTMLInputElement;
  if (colorInput.files!.length != 0 && heightInput.files!.length != 0) {
    return new Promise(async (resolve) => {
      const color = new Image();
      const height = new Image();
      let loaded: 0|1|2 = 0;

      const color_reader: FileReader = new FileReader();
      color_reader.onload = (e: ProgressEvent<FileReader>) => {
        color.src = e.target!.result as string;
        loaded++;
      };

      const height_reader: FileReader = new FileReader();
      height_reader.onload = (e: ProgressEvent<FileReader>) => {
        height.src = e.target!.result as string;
        loaded++;
      };

      color_reader.readAsDataURL(colorInput.files![0]);
      height_reader.readAsDataURL(heightInput.files![0]);

      while (loaded < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }

      await Promise.all([color.decode(), height.decode()]);
      resolve({
        color: {image: color, data: loadImageData(color)},
        height: {
          image: height,
          data: {
            values: hightMapFromImageData(loadImageData(height)),
            width: height.naturalWidth,
            height: height.naturalHeight
          }
        }
      });
    });
  } else {
    return new Promise((resolve) => {
      resolve({
        color: {image: MAP_1_COLOR, data: loadImageData(MAP_1_COLOR)},
        height: {
          image: MAP_1_HEIGHT,
          data: {
            values: hightMapFromImageData(loadImageData(MAP_1_HEIGHT)),
            width: MAP_1_HEIGHT.naturalWidth,
            height: MAP_1_HEIGHT.naturalHeight
          }
        }
      });
    });
  }
}

function loadImageData(image: HTMLImageElement): ImageData {
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  const ctx: CanvasRenderingContext2D =
      canvas.getContext('2d') as CanvasRenderingContext2D;
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
}

function hightMapFromImageData(data: ImageData): Array<Float32Array> {
  const res: Array<Float32Array> = new Array<Float32Array>(data.height);
  for (let y = 0; y < data.height; y++) {
    res[y] = new Float32Array(data.width);
    for (let x = 0; x < data.width; x++) {
      res[y][x] = 0;
      res[y][x] += data.data[((y * data.width + x) * 4) + 0];
      res[y][x] += data.data[((y * data.width + x) * 4) + 1];
      res[y][x] += data.data[((y * data.width + x) * 4) + 2];
      res[y][x] /= 3;
    }
  }
  return res;
}

function drawLine(state: VoxelSpace, start: Coord, end: Coord, map_pos: Coord) {
  if (start.y < end.y) {
    return;
  }
  if (start.y < 0) {
    start.y = 0;
  }
  const r =
      state.map.color.data
          .data[((map_pos.y * state.map.color.data.width + map_pos.x) * 4) + 0];
  const g =
      state.map.color.data
          .data[((map_pos.y * state.map.color.data.width + map_pos.x) * 4) + 1];
  const b =
      state.map.color.data
          .data[((map_pos.y * state.map.color.data.width + map_pos.x) * 4) + 2];
  state.framebuffer.ctx.strokeStyle = `rgb(${r},${g},${b})`;
  state.framebuffer.ctx.beginPath();
  state.framebuffer.ctx.moveTo(start.x, start.y);
  state.framebuffer.ctx.lineTo(end.x, end.y);
  state.framebuffer.ctx.stroke();
}

function render(state: VoxelSpace) {
  state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
  state.framebuffer.ctx.clearRect(
      0, 0, state.framebuffer.canvas.width, state.framebuffer.canvas.height);
  // precalculate viewing angle parameters
  const sinPhi = Math.sin(state.state.phi);
  const cosPhi = Math.cos(state.state.phi);

  const hbuffer = new Array<number>(state.framebuffer.canvas.width)
                      .fill(state.framebuffer.canvas.height);

  let dz = 1.0;
  let z = 1.0;
  while (z < state.state.distance) {
    let pleft: Coord = {
      x: (-cosPhi * z - sinPhi * z) + state.state.pos.x,
      y: (sinPhi * z - cosPhi * z) + state.state.pos.y
    };
    let pright: Coord = {
      x: (cosPhi * z - sinPhi * z) + state.state.pos.x,
      y: (-sinPhi * z - cosPhi * z) + state.state.pos.y
    };

    const dx = (pright.x - pleft.x) / state.map.height.data.width;
    const dy = (pright.y - pleft.y) / state.map.height.data.width;

    for (let i = 0; i < state.framebuffer.canvas.width; i++) {
      const map_pos: Coord = {
        x: (Math.floor(pleft.x) + (state.map.height.data.width * 2)) %
            state.map.height.data.width,
        y: (Math.floor(pleft.y) + (state.map.height.data.height * 2)) %
            state.map.height.data.height,
      };
      const height_on_screen =
          (state.state.height -
           state.map.height.data.values[map_pos.y][map_pos.x]) /
              z * state.state.scale_height +
          state.state.horizon;
      drawLine(
          state, {x: i, y: hbuffer[i]}, {x: i, y: height_on_screen},
          {x: map_pos.x, y: map_pos.y});
      if (height_on_screen < hbuffer[i]) {
        hbuffer[i] = height_on_screen;
      }
      pleft.x = pleft.x + dx;
      pleft.y = pleft.y + dy;
    }
    z += dz;
    dz += 0.2;
  }
  state.ctx.drawImage(
      state.framebuffer.canvas, 0, 0, state.canvas.width, state.canvas.height);
}
