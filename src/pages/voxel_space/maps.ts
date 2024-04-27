import map_1_color_meta from './images/1_color.png';
import map_1_height_meta from './images/1_height.png';

export const MAP_1_COLOR = new Image(
    map_1_color_meta.width,
    map_1_color_meta.height,
);
export const MAP_1_HEIGHT = new Image(
    map_1_height_meta.width,
    map_1_height_meta.height,
);
await Promise.all([
  new Promise((resolve) => {
    MAP_1_COLOR.src = map_1_color_meta.src;
    MAP_1_COLOR.onload = resolve;
  }),
  new Promise((resolve) => {
    MAP_1_HEIGHT.src = map_1_height_meta.src;
    MAP_1_HEIGHT.onload = resolve;
  }),
]);