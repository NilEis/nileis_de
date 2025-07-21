interface IRoute {
  name: string;
  url: string;
  absoluteUrl?: (base: string) => string;
  Description?: string;
  children?: IRoute[];
  reload?: boolean;
}
export class Route implements IRoute {
  name: string;
  url: string;
  absoluteUrl: (base: string) => string;
  Description?: string;
  children?: Route[];
  reload: boolean;
  constructor(options: IRoute) {
    this.name = options.name;
    this.url = options.url;
    this.absoluteUrl = (base) => {
      if (options.absoluteUrl) {
        return options.absoluteUrl(base);
      }
      return '';
    };
    this.Description = options.Description;
    this.children = options.children?.map((child) => new Route(child));
    this.reload = options.reload ?? true;
  }
};

export const routes: Route[] = generateRoutes([
  {
    name: 'chip-8',
    url: 'chip-8/',
    Description:
        'This page hosts a Chip-8 emulator, allowing users to run and interact with Chip-8 programs directly in their browser. It features a canvas for rendering the emulators output and includes functionality to enter fullscreen mode for an immersive experience. The page also displays logs or output messages below the emulator for additional feedback.'
  },
  {
    name: 'Automatic Tower defence',
    url: 'twd/',
    Description:
        'An automatic tower defence game. This page hosts a browser-based game called "Automatic Tower Defence," built using the Godot engine. It features a canvas for rendering the game and includes a status overlay that displays a loading progress bar or error messages if required features are missing. The page ensures compatibility by checking for necessary browser features and attempts to resolve issues, such as registering a service worker if needed. Once everything is ready, the game starts and provides an immersive, fullscreen experience.'
  },
  {
    name: 'Wave function collapse',
    url: 'wfc/',
    Description:
        'This page showcases a Wave Function Collapse (WFC) algorithm visualization. It features an interactive canvas where users can observe the algorithm in action, generating patterns or solving constraints dynamically. The page is wrapped in a clean layout and ensures compatibility with modern browsers, providing an engaging experience for exploring procedural generation techniques.'
  },
  {
    name: 'RegexToNFA',
    url: 'regex/',
    Description:
        'A regular expression to NFA converter. It converts a regular expression to a non-deterministic finite automaton and then to a deterministic finite automaton. Both are displayed as graphs. It is written in C#'
  },
  {
    name: 'Voxel space',
    url: 'voxel_space/',
    Description: 'A voxel space renderer written in typescript'
  },
  {
    name: 'Voxel space in wasm',
    url: 'voxel_space_wasm/',
    Description: 'A voxel space renderer written in C compiled to wasm.'
  },
  {
    name: 'lua',
    url: 'lua_wasm/',
    Description: 'A lua interpreter written in C compiled to wasm'
  },
  {
    name: 'Sonderzeichen',
    url: 'sonderzeichen/',
    Description:
        'A tool to convert special characters to a special sonderzeichen format. It replaces characters with similar looking characters'
  },
  {
    name: 'Hackertype',
    url: 'hackertype/',
    Description:
        'A tool that prints source code in a hacker style. It is a joke.'
  },
  {
    name: 'Kruskal minimum spanning tree',
    url: 'kruskal/',
    Description:
        'A tool to visualize the Kruskal algorithm for finding the minimum spanning tree of a graph.'
  },
  {
    name: 'Whatsapp backup viewer',
    url: 'chat_viewer/',
    Description:
        'A tool to view whatsapp chat backups. It can display the chat, sounds, images and videos'
  },
  {
    name: 'AI',
    url: 'ai/',
    children: [{
      name: 'Image to Latex',
      url: 'image_to_latex/',
      Description:
          'This page allows users to upload an image containing mathematical expressions, which is then converted into LaTeX code. The page displays the uploaded image, the generated LaTeX code, and a rendered preview of the mathematical expressions. It includes a loading animation while processing the image and provides a clean, interactive interface for converting images to LaTeX.'
    }],
    Description:
        'This page is a directory for AI-related tools or resources. It features a clean and simple design with a full-screen layout. The page includes a list of links, such as "Image to Latex," which directs users to specific AI tools or functionalities. The links are organized alphabetically for easy navigation.'
  },
  {
    name: 'Asteroid',
    url: 'asteroid/',
    Description: 'A clone of the game Asteroid using godot'
  },
  {
    name: 'Search',
    url: 'search/',
    Description:
        'This page provides a vector-based search functionality. Users can input a search term into the search bar, and the page dynamically retrieves and displays the most relevant results based on semantic similarity. The results are ranked using a cosine distance metric and link to related resources. It offers an interactive and efficient way to explore content using advanced embedding techniques.'
  },
  {
    name: 'Texte',
    url: 'blog/',
    reload: false,
    Description:
        'This page hosts a collection of blog posts or articles. It features a clean layout with a list of clickable titles, each leading to a specific blog post. Users can navigate through the posts and read detailed articles on various topics. The page ensures readability and accessibility for an engaging reading experience. AMOGUS',
    children: [
      {name: 'Amogus', url: 'amogus/', Description: 'AMOGUS'},
      {name: 'Babel', url: 'babel/', reload: false, Description: 'Babel 😳'},
      {
        name: 'Recipes',
        url: 'recipes/',
        reload: false,
        Description: 'Some recipes idk.',
        children: [
          {
            name: 'Taiwanese beef noodle soup',
            url: '牛肉麵/',
            Description: 'A Taiwanese beef noodle soup recipe. (牛肉麵)'
          },
        ]
      },
    ]
  },
  {name: 'Reversi', url: 'reversi/', Description: 'A clone of the game reversi'}
]);

export const path_routes: Map<string, Route> = generatePathRoutes(routes, '');

function generatePathRoutes(
    routes: Route[], parentPath: string): Map<string, Route> {
  let pr = new Map<string, Route>();
  for (const route of routes) {
    const path = parentPath + route.url;
    route.absoluteUrl = (base) => new URL(path, base).href;
    pr.set(path, route);
    if (route.children) {
      pr = new Map<string, Route>(
          [...pr, ...generatePathRoutes(route.children, path)]);
    }
  }
  return pr;
}

function generateRoutes(routes: IRoute[]): Route[] {
  for (const route of routes) {
    if (route.children) {
      route.children = generateRoutes(route.children);
    }
  }
  const res = routes.sort((a, b) => a.name.localeCompare(b.name))
                  .map((route) => new Route(route));
  return res;
}