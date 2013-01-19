precision mediump float;

uniform float Time;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNormMat;

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec3 aBar;

varying vec4 Position;
varying vec3 Normal;
varying vec4 Color;
varying vec3 Bar;

void main(void)
{
    
  Position = vec4(aVertexPosition, 1.0);
  Normal = uNormMat * aVertexNormal;

  Bar = aBar;
  gl_Position = uPMatrix * uMVMatrix * Position;
  //Color = vec4((aVertexPosition + vec3(1.0, 1.0, 1.0)) * 0.5, 1.0);
}

