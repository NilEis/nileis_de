export type Route = {
  name: string; url: string;
  children?: Route[];
};

export const routes: Route[] = generateRoutes([
  {name: 'chip-8', url: 'chip-8/'},
  {name: 'Tower defence', url: 'twd/'},
  {name: 'Wave function collapse', url: 'wfc/'},
  {name: 'RegexToNFA', url: 'regex/'},
  {name: 'Voxel space', url: 'voxel_space/'},
  {name: 'Voxel space in wasm', url: 'voxel_space_wasm/'},
  {name: 'lua', url: 'lua_wasm/'},
  {name: 'Sonderzeichen', url: 'sonderzeichen/'},
  {name: 'Hackertype', url: 'hackertype/'},
  {name: 'Whatsapp backup viewer', url: 'chat_viewer/'},
  {
    name: 'AI',
    url: 'ai/',
    children: [{name: 'Image to Latex', url: 'image_to_latex/'}]
  },
  {name: 'Asteroid', url: 'asteroid/'},
  {name: 'Search', url: 'search/'},
]);

function generateRoutes(routes: Route[]): Route[] {
  for (const route of routes) {
    if (route.children) {
      route.children = generateRoutes(route.children);
    }
  }
  routes = routes.sort((a, b) => a.name.localeCompare(b.name));
  return routes;
}