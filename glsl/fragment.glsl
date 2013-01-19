precision mediump float;

uniform mat4 uMVMatrix;

varying vec4 Position;
varying vec3 Normal;
varying vec4 Color;
varying vec3 Bar;


void main(void) 
{
  vec3 lightpos = vec3(10.0, 10.0, 10.0);
  vec3 pos = vec3(uMVMatrix * Position);
  vec3 veiw_pos = vec3(0, 0, 0);
  vec3 lightdir = normalize(lightpos - pos);
  float diffuse = max(dot(lightdir, Normal), 0.0);
  vec3 v = pos - veiw_pos;
  vec3 r = reflect(normalize(v), Normal);
  float spec = pow(clamp(dot(lightdir, r), 0.0, 1.0), 60.0);
  
  /*
  if(any(lessThan(Bar, vec3(0.1))))
  {
    gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
  }
  else
  {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
  gl_FragColor = vec4(spec, diffuse + spec, spec, 1.0);
  */                         

  gl_FragColor = vec4(spec, 0.5 * diffuse + spec, spec, 1.0);
}

