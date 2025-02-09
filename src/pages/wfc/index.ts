import type {APIRoute} from "astro";

interface Constraint
{
  left: Set<Tile>;
  right: Set<Tile>;
  up: Set<Tile>;
  down: Set<Tile>;
  [index: string]: Set<Tile>;
}
;

class Tile
{
  private readonly color: string;
  private name: string;
  private _constraints: Constraint|undefined;
  readonly weight: number;

  constructor(color: string, name: string, weight: number)
  {
    this.color = color;
    this.name = name;
    this.weight = weight;
  }

  public set constraints(value: Constraint)
  {
    this._constraints = value;
  }
  public get constraints(): Constraint
  {
    return this._constraints!;
  }
  get colour(): string
  {
    return this.color;
  }
}

const SEA: Tile = new Tile ("blue", "sea", 3 / 6);
const SEA_COAST: Tile = new Tile ("lightblue", "coast", 1 / 6);
const COAST: Tile = new Tile ("yellow", "coast", 1 / 6);
const LAND: Tile = new Tile ("green", "land", 1 / 6);
SEA.constraints = {
  left: new Set<Tile> ([ SEA, SEA_COAST ]),
  right: new Set<Tile> ([ SEA, SEA_COAST ]),
  up: new Set<Tile> ([ SEA ]),
  down: new Set<Tile> ([ SEA, SEA_COAST ])
};

SEA_COAST.constraints = {
  left: new Set<Tile> ([ COAST, SEA_COAST ]),
  right: new Set<Tile> ([ SEA, SEA_COAST ]),
  up: new Set<Tile> ([ SEA ]),
  down: new Set<Tile> ([ SEA_COAST, COAST ])
};

COAST.constraints = {
  left: new Set<Tile> ([ COAST, LAND ]),
  right: new Set<Tile> ([ COAST, SEA_COAST ]),
  up: new Set<Tile> ([ SEA_COAST ]),
  down: new Set<Tile> ([ LAND ])
};

LAND.constraints = {
  left: new Set<Tile> ([ LAND ]),
  right: new Set<Tile> ([ COAST, LAND ]),
  up: new Set<Tile> ([ COAST, LAND ]),
  down: new Set<Tile> ([ LAND ])
};


class Cell
{
  private collapsed: boolean;
  private cell: Set<Tile>|Tile;
  private restorable: Set<Tile>;
  constructor()
  {
    this.collapsed = false;
    this.cell = new Set<Tile> ([ SEA, COAST, LAND ]);
    this.restorable = this.cell;
  }
  is_collapsed(): boolean
  {
    return this.collapsed;
  }
  collapse(force: Tile|null = null): void
  {
    if (force == null)
    {
      const arr: Array<Tile> = Array.from ((this.cell as Set<Tile>).values ());
      if (1)
      {
        const totalWeight: number
            = arr.reduce ((a: number, b: Tile) => a + b.weight, 0);
        let random = Math.random () * totalWeight;
        this.cell = arr.find ((_, i) => (random -= arr[i].weight) <= 0)!;
      }
      else
      {
        const rand = Math.floor (Math.random () * 100000) % arr.length;
        this.cell = arr[rand];
      }
    }
    else
    {
      this.cell = force;
    }
    this.collapsed = true;
  }

  get color(): string
  {
    return (this.cell as Tile).colour;
  }

  public get entropy(): number
  {
    const arr: Array<Tile> = Array.from ((this.cell as Set<Tile>).values ());
    const sum: number = arr.reduce ((acc, curr) => acc + curr.weight, 0);
    const sum_with_log: number = arr.reduce ((acc, curr) => acc + (curr.weight * Math.log (curr.weight)), 0);
    return Math.log (sum) - (sum_with_log / sum);
  }
  public get tile(): Tile
  {
    return this.cell as Tile;
  }
  public propagate(tile: Tile, dir: string): boolean
  {
    if (!this.collapsed)
    {
      this.restorable = new Set<Tile> (this.cell as Set<Tile>);
      for (const t of this.cell as Set<Tile>)
      {
        if (!tile.constraints[dir].has (t))
        {
          (this.cell as Set<Tile>).delete (t);
        }
      }
      if ((this.cell as Set<Tile>).size == 0)
      {
        this.cell = this.restorable;
        return false;
      }
    }
    return true;
  }
  public restore(): void
  {
    this.cell = new Set<Tile> (this.restorable);
  }
}

interface Coordinate
{
  x: number;
  y: number;
}

export interface Wfc
{
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  map: {
    cell: { width: number; height: number };
    width: number;
    height: number;
    array: Array<Array<Cell>>;
    size: number;
  };
  animated: boolean;
  first: boolean;
}

function canvas_resize_handler(wfc: Wfc)
{
  wfc.canvas.width = window.innerWidth;
  wfc.canvas.height = window.innerHeight;
  wfc.map.cell.width = wfc.canvas.width / wfc.map.width;
  wfc.map.cell.height = wfc.canvas.height / wfc.map.height;
}

export const init = ():
Wfc =>
{
  const res: Wfc = {
    first: true,
    animated: false,
    canvas: document.getElementById ("canvas")! as HTMLCanvasElement,
    ctx: (document.getElementById ("canvas")! as HTMLCanvasElement)
      .getContext ("2d")!,
    map: {
      cell: {width: 0, height: 0},
      width: 10,
      height: 10,
      size: 10 * 10,
      array: (new Array<Array<Cell>>)
    }
  };
  res.canvas.onresize = () =>
  {
    canvas_resize_handler (res);
  };

  const url = new URL (window.location.toLocaleString ());
  if (url.searchParams.has ("width"))
  {
    res.map.width = Number.parseInt (url.searchParams.get ("width")!);
  }
  if (url.searchParams.has ("height"))
  {
    res.map.height = Number.parseInt (url.searchParams.get ("height")!);
  }
  if (url.searchParams.has ("anim"))
  {
    res.animated = true;
  }

  res.map.size = res.map.height * res.map.width;

  res.map.array = Array.from (
    {length: res.map.height},
    (_, i): Array<Cell > => Array.from ({length: res.map.width}, (): Cell => (new Cell))
  );
  canvas_resize_handler (res);
  res.canvas.style.backgroundColor = "black";
  console.log (res);
  return res;
}

function get_valid_neighbours(wfc: Wfc, x: number, y: number): Array<{
  coord: Coordinate; dir: string;
}>
{
  const dirs = new Array<{ x: number; y: number; dir: string }> (
    {x: -1, y: 0, dir: "left"}, {x: 1, y: 0, dir: "right"},
    {x: 0, y: -1, dir: "up"}, {x: 0, y: 1, dir: "down"}
  );
  const res: Array<{ coord: Coordinate; dir: string }>
      = (new Array<{ coord: Coordinate; dir: string }> );
  for (const {x: x_offset, y: y_offset, dir: dir} of dirs)
  {
    const new_x = x + x_offset;
    const new_y = y + y_offset;
    if (0 <= new_x && new_x < wfc.map.width && 0 <= new_y
      && new_y < wfc.map.height)
    {
      res.push ({coord: {x: new_x, y: new_y}, dir: dir});
    }
  }
  return res;
}

function collapse(wfc: Wfc): boolean
{
  if (wfc.map.size == 0)
  {
    return false;
  }
  wfc.map.size--;
  let current_cell: Coordinate = {x: 0, y: 0};
  for (let y = 0; y < wfc.map.array.length; y++)
  {
    for (let x = 0; x < wfc.map.array[y].length; x++)
    {
      if ((wfc.map.array[current_cell.y][current_cell.x].is_collapsed ())
        || (!wfc.map.array[y][x].is_collapsed ()
          && wfc.map.array[y][x].entropy
          < wfc.map.array[current_cell.y][current_cell.x].entropy))
      {
        current_cell = {x: x, y: y};
      }
    }
  }
  if (!wfc.map.array[current_cell.y][current_cell.x].is_collapsed ())
  {
    wfc.map.array[current_cell.y][current_cell.x].collapse ();
    if (wfc.animated)
    {
      draw (wfc, current_cell.x, current_cell.y);
    }
    const curr: Tile = wfc.map.array[current_cell.y][current_cell.x].tile;
    const processed: Array < Coordinate >= (new Array<Coordinate>);
    for (const pos of get_valid_neighbours (wfc, current_cell.x, current_cell.y))
    {
      if (wfc.map.array[pos.coord.y][pos.coord.x].propagate (curr, pos.dir))
      {
        processed.push (pos.coord);
      }
      else
      {
        for (const p of processed)
        {
          wfc.map.array[p.y][p.x].restore ();
        }
        break;
      }
    }
  }
  wfc.first = false;
  return true;
}

function draw(wfc: Wfc, x: number, y: number)
{
  let color: string = "black";
  if (wfc.map.array[y][x].is_collapsed ())
  {
    color = wfc.map.array[y][x].color;
  }
  else
  {
    const w = (wfc.map.array[y][x].entropy) * 100;
    color = `rgb(${w}, ${w}, ${w})`;
  }
  wfc.ctx.fillStyle = color;
  wfc.ctx.fillRect (
    x * wfc.map.cell.width, y * wfc.map.cell.height, wfc.map.cell.width,
    wfc.map.cell.height
  );
}

export const main
    = async (wfc: Wfc) =>
    {
      while (collapse (wfc) && wfc.animated);
      if (!wfc.animated)
      {
        wfc.map.array.forEach ((c, y, _) =>
        {
          c.forEach ((_, x, __) =>
          {
            draw (wfc, x, y);
          })
        })
      }
      requestAnimationFrame (() => main (wfc));
    }

export const GET: APIRoute = ({params, request}) =>
{
  return new Response (null, {status: 204});
}
