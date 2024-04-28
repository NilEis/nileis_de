import map_1_color_meta from './images/1_color.png';
import map_1_height_meta from './images/1_height.png';

export async function loadMap1Color(): Promise<HTMLImageElement> {
  const MAP_1_COLOR: HTMLImageElement = new Image(
      map_1_color_meta.width,
      map_1_color_meta.height,
  );
  return new Promise((resolve) => {
    MAP_1_COLOR.src = map_1_color_meta.src;
    MAP_1_COLOR.onload = () => resolve(MAP_1_COLOR);
  });
}

export async function loadMap1Height(): Promise<HTMLImageElement> {
  const MAP_1_HEIGHT: HTMLImageElement = new Image(
      map_1_height_meta.width,
      map_1_height_meta.height,
  );
  return new Promise((resolve) => {
    MAP_1_HEIGHT.src = map_1_height_meta.src;
    MAP_1_HEIGHT.onload = () => resolve(MAP_1_HEIGHT);
  });
}