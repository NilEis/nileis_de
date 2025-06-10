import main_frag from "./shader/_main.frag?raw";
import main_vert from "./shader/_main.vert?raw";
import { webgl } from "./webgl";

type WebGL =
{
  gl: WebGL2RenderingContext;
  shader: WebGLProgram;
  attribs:
  {
    posOffsets: GLint;
  };
  offsetVAO: WebGLVertexArrayObject;

  uniforms:
  {
    projectionMatrix: WebGLUniformLocation;
    modelViewMatrix: WebGLUniformLocation;
  };
  buffers:
  {
    position: WebGLBuffer;
  };
};

type Kruskal = {
  canvas:
  {
    canvas: HTMLCanvasElement;
    webgl: WebGL;
  };
  n_verticies: number;
};

function initWebGL(canvas: HTMLCanvasElement, n_verticies: number): {
  success: true;
  webgl: WebGL;
} | {
  success: false;
  error: string;
}
{
  // Get WebGL2 context
  const ctx = canvas.getContext ("webgl2");
  if(ctx === null)
  {
    return {success: false, error: "WebGL2 not supported"};
  }

  // Create verticies
  const verticies = new Float32Array (n_verticies * 2);
  for(let i = 0; i < n_verticies; i++)
  {
    const index = i * 2;
    verticies[index] = (Math.random () * 2.0) - 1.0;
    verticies[index + 1] = (Math.random () * 2.0) - 1.0;
  }
  console.log (verticies);

  // Create a buffer for the position of the verticies
  const positionBuffer = createPositionBuffer (ctx, verticies);

  // Compile and link shaders
  const shaderProg = webgl.linkShader (ctx, main_vert, main_frag);
  if(shaderProg.success === false)
  {
    return {success: false, error: shaderProg.error};
  }

  const projectionMatrix = ctx.getUniformLocation (shaderProg.program, "uProjectionMatrix")!;
  const modelViewMatrix = ctx.getUniformLocation (shaderProg.program, "uModelViewMatrix")!;

  // if(projectionMatrix === null || modelViewMatrix === null)
  // {
  //   return {success: false, error: "Could not get uniform location"};
  // }

  const posOffsets = ctx.getAttribLocation (shaderProg.program, "aOffset");

  const vao = ctx.createVertexArray ();
  ctx.bindVertexArray (vao);
  ctx.enableVertexAttribArray (posOffsets);
  ctx.vertexAttribPointer (posOffsets, 2, ctx.FLOAT, false, 0, 0);

  return {success: true,
    webgl:
    {
      gl: ctx,
      shader: shaderProg.program,
      attribs:
      {
        posOffsets,
      },
      offsetVAO: vao,
      uniforms:
      {
        projectionMatrix,
        modelViewMatrix
      },
      buffers:
      {
        position: positionBuffer
      },
    }}
}

function createPositionBuffer(ctx: WebGL2RenderingContext, verticies: Float32Array): WebGLBuffer
{
  const positionBuffer = ctx.createBuffer ();
  ctx.bindBuffer (ctx.ARRAY_BUFFER, positionBuffer);
  ctx.bufferData (ctx.ARRAY_BUFFER, verticies, ctx.STATIC_DRAW);
  return positionBuffer;
}

function init(canvas: HTMLCanvasElement, options: {
  n_verticies?: number;
} = {}): { success: true; kruskal: Kruskal } | { success: false; error: string }
{
  const n_verticies = options.n_verticies ?? 1000;

  // Initialize WebGL
  const webGLContext = initWebGL (canvas, n_verticies);
  if(webGLContext.success === false)
  {
    return webGLContext;
  }

  return {success: true, kruskal: {
    canvas:
     {
       canvas,
       webgl: webGLContext.webgl
     },
    n_verticies: n_verticies
  }};
}

function draw(kruskal: Kruskal)
{
  const webgl = kruskal.canvas.webgl;
  const gl = webgl.gl;
  gl.clearColor (0,0,0,1);
  gl.viewport (0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clear (gl.COLOR_BUFFER_BIT);
  gl.useProgram (webgl.shader);
  gl.bindVertexArray (webgl.offsetVAO);
  gl.drawArrays (gl.POINTS, 0, kruskal.n_verticies);
  gl.flush ();
}

export const Kruskal = {
  init,
  draw
}
