type ShaderType = WebGL2RenderingContext["VERTEX_SHADER"] | WebGL2RenderingContext["FRAGMENT_SHADER"];

function compileShader(gl: WebGL2RenderingContext, source: string, type: ShaderType): { success: true; shader: WebGLShader } | { success: false; error: string }
{
  const shader = gl.createShader (type);
  if(shader === null)
  {
    return { success: false, error: "Could not create shader" };
  }
  gl.shaderSource (shader, source);
  gl.compileShader (shader);
  if(!gl.getShaderParameter (shader, gl.COMPILE_STATUS))
  {
    return { success: false, error: gl.getShaderInfoLog (shader)! };
  }
  return { success: true, shader };
}

function linkShader(gl: WebGL2RenderingContext, vertexShader: string, fragmentShader: string):
{ success: false; error: string } | { success: true; program: WebGLProgram }
{
  const program = gl.createProgram ();
  const vertex = compileShader (gl, vertexShader, gl.VERTEX_SHADER);
  if(vertex.success === false)
  {
    return {success: false, error: vertex.error};
  }
  const fragment = compileShader (gl, fragmentShader, gl.FRAGMENT_SHADER);
  if(fragment.success === false)
  {
    return {success: false, error: fragment.error};
  }
  gl.attachShader (program, vertex.shader);
  gl.attachShader (program, fragment.shader);
  gl.linkProgram (program);
  if(!gl.getProgramParameter (program, gl.LINK_STATUS))
  {
    return {success: false, error: gl.getProgramInfoLog (program)!};
  }
  gl.deleteShader (vertex.shader);
  gl.deleteShader (fragment.shader);
  return {success: true, program};
}

export const webgl = {
  linkShader
};
