attribute vec2 aOffset;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
void main() { 
    gl_PointSize = 1.0;
    gl_Position = vec4(aOffset, 0.0, 0.0);
}