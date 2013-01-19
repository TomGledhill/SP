var gl = null;
var vertexBuffer = null;
var normalBuffer = null;
var indexBuffer = null;
var BarBuffer = null;
var shaderProgram = null;
var vertexShader = null;
var fragmentShader = null;
var animRequest = null;
var startTime = new Date().getTime() / 1000.0;
var fpscounter = null;
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();
var nMatrix = mat4.create();
var vertexShaderEditor = null;
var fragmentShaderEditor = null;


function throwOnGLError(err, funcName, args)
{
  var gl_error = WebGLDebugUtils.glEnumToString(err);  
  throw new Error("WebGL Error: '" + gl_error + "' was caused by call to '" + funcName + "'");
}


function initGL(canvas) 
{
  var gl = WebGLUtils.setupWebGL(canvas[0]);
  if (gl)
  {
    gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError);

    canvas[0].width = canvas.width();
    canvas[0].height = canvas.height();

    gl.viewportWidth = canvas.width();
    gl.viewportHeight = canvas.height();
    gl.canvas = canvas[0];
  }

  return gl
}


function getShader(gl, shader_code, type) 
{
  var shader;
  if (type == "fragment") 
  {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } 
  else if (type == "vertex") 
  {
    shader = gl.createShader(gl.VERTEX_SHADER);
  }
  else
  {
    throw new Error("Unknown shader type: " + String(type));
  }

  gl.shaderSource(shader, shader_code);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(shader));

  return shader;
}


function loadShaders(gl, vertex_code, fragment_code) 
{
  // remove old shader program.
  if (vertexShader != null)
  {
    gl.detachShader(shaderProgram, vertexShader);
    gl.deleteShader(vertexShader);
  }  
  if (fragmentShader != null)
  {
    gl.detachShader(shaderProgram, fragmentShader);
    gl.deleteShader(fragmentShader);
  }  
  if (shaderProgram != null)
    gl.deleteProgram(shaderProgram);

  vertexShader = getShader(gl, vertex_code, "vertex");
  fragmentShader = getShader(gl, fragment_code, "fragment");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  
  // Bind attributes 
  gl.bindAttribLocation(shaderProgram, shaderProgram.vertexPositionAttribute = 0, "aVertexPosition")
  gl.bindAttribLocation(shaderProgram, shaderProgram.vertexNormalAttribute = 1, "aVertexNormal")
  gl.bindAttribLocation(shaderProgram, shaderProgram.vertexBarAttribute = 2, "aBar")
  
  gl.linkProgram(shaderProgram);
  
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
  {
    throw new Error("Failed to create shader program");
    alert(gl.getProgramInfoLog(shaderProgram));
    vertexShader = null;
    fragmentShader = null;
    return null;  
  }
  
  gl.useProgram(shaderProgram);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
      3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
      3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ARRAY_BUFFER, BarBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexBarAttribute, 
      3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderProgram.vertexBarAttribute);

  shaderProgram.timeUniform = gl.getUniformLocation(shaderProgram, "Time");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNormMat");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");

  return shaderProgram;
}


function setMatrixUniforms()
{
  if (shaderProgram.pMatrixUniform != -1)
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  if (shaderProgram.mvMatrixUniform != -1)
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

  if (shaderProgram.nMatrixUniform != -1)
  {
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
  }
}

// monkey to WebGL buffers reading function
function loadGeometry(gl, monkey)
{
  var curind = 0;
  var noofVertices = 0;
  var noofNormals = 0;
  var noofFacets = 0;
  
  // compute number of vertices, normals...
  while ((curind = monkey.indexOf("v ", curind)) != -1)
  {
    curind++;
    noofVertices++;
  }

  curind = 0;
  while ((curind = monkey.indexOf("vn ", curind)) != -1)
  {
    curind++;
    noofNormals++;
  }
  curind = 0;
  while ((curind = monkey.indexOf("f ", curind)) != -1)
  {
    curind++;
    noofFacets++;
  }

  var bufs = rawStringToBuffers(monkey, noofVertices, noofNormals, noofFacets);

  var vertexFloat32Array = new Float32Array(bufs[0]);
  var normalFloat32Array = new Float32Array(bufs[1]);
  var indexUint16Array = new Uint16Array(bufs[2]);

  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 
    vertexFloat32Array, gl.STATIC_DRAW);
  vertexBuffer.vertexSize = 3;
  vertexBuffer.noofVertices = noofVertices;

  normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 
    normalFloat32Array, gl.STATIC_DRAW);
  normalBuffer.vertexSize = 3;
  normalBuffer.noofVertices = noofNormals;


  var BarFloat32Array = new Float32Array(noofFacets * 9);
  for (var i = 0; i < noofFacets * 9; i += 9)
  {
    BarFloat32Array[i] = 1.0;
    BarFloat32Array[i + 1] = 0.0;
    BarFloat32Array[i + 2] = 0.0;

    BarFloat32Array[i + 3] = 0.0;
    BarFloat32Array[i + 4] = 1.0;
    BarFloat32Array[i + 5] = 0.0;

    BarFloat32Array[i + 6] = 0.0;
    BarFloat32Array[i + 7] = 0.0;
    BarFloat32Array[i + 8] = 1.0;
  }
  
  /*
  for (var i = 0; i < noofFacets * 3; i += 3)
  {
    BarFloat32Array[3 * bufs[2][i]] = 1.0;
    BarFloat32Array[3 * bufs[2][i] + 1] = 0.0;
    BarFloat32Array[3 * bufs[2][i] + 2] = 0.0;

    BarFloat32Array[3 * bufs[2][i + 1]] = 0.0;
    BarFloat32Array[3 * bufs[2][i + 1] + 1] = 1.0;
    BarFloat32Array[3 * bufs[2][i + 1] + 2] = 0.0;

    BarFloat32Array[3 * bufs[2][i + 2]] = 0.0;
    BarFloat32Array[3 * bufs[2][i + 2] + 1] = 0.0;
    BarFloat32Array[3 * bufs[2][i + 2] + 2] = 1.0;
  }
  */
  
  BarBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, BarBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 
    new Float32Array(BarFloat32Array), gl.STATIC_DRAW);
  BarBuffer.vertexSize = 3;
  BarBuffer.noofVertices = noofFacets * 9;
  
  indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 
    indexUint16Array, gl.STATIC_DRAW);
  indexBuffer.noofIndices = noofFacets * 3;

  return [vertexBuffer, normalBuffer, indexBuffer]
}


function drawScene(gl, vertexBuffer, indexBuffer)
{
  var time = new Date().getTime() / 1000.0 - startTime;

  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

  mat4.perspective(90, gl.viewportWidth / gl.viewportHeight, 
      0.1, 100.0, pMatrix);

  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, [0, -10, -15]);
  mat4.rotateY(mvMatrix, time);
  setMatrixUniforms();

  gl.uniform1f(shaderProgram.timeUniform, time);


  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

  gl.drawElements(gl.TRIANGLES, indexBuffer.noofIndices, 
      gl.UNSIGNED_SHORT, 0);
}


function tick(gl, vertexBuffer, indexBuffer)
{
  function render() 
  {
    animRequest = requestAnimFrame(render, gl.canvas);
    drawScene(gl, vertexBuffer, indexBuffer);
  }
  render();
}


function reloadData()
{
  if (!gl)
    return;

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  if (animRequest != null)
  {
    cancelRequestAnimFrame(animRequest);
    animRequest = null;
  }

  try
  {
    //var c2g_file = $.base64.decode($("#c2g-base64").val().split('\n').join(''));
    loadGeometry(gl, getSync("data/cow.obj"));
  }
  catch (e)
  {
    alert(e.message); 
    return;
  }  

  try
  {
    shaderProgram = loadShaders(gl, 
        vertexShaderEditor.getSession().getValue(), 
        fragmentShaderEditor.getSession().getValue());
    if (shaderProgram == null)
      return;
  }
  catch (e)
  {
    alert(e.message);
    return;
  }

  if (vertexBuffer == null || indexBuffer == null)
    return;

  tick(gl, vertexBuffer, indexBuffer);
}

function DeinitWebGL()
{
  if (vertexShader != null)
  {
    gl.detachShader(shaderProgram, vertexShader);
    gl.deleteShader(vertexShader);
    vertexShader = null;
  }  
  if (fragmentShader != null)
  {
    gl.detachShader(shaderProgram, fragmentShader);
    gl.deleteShader(fragmentShader);
    fragmentShader = null;
  }  
  if (shaderProgram != null)
  {
    gl.deleteProgram(shaderProgram);
    shaderProgram = null
  }
  if (vertexBuffer != null)
  {
    gl.deleteBuffer(vertexBuffer);
    vertexBuffer = null
  }

  if (normalBuffer != null)
  {
    gl.deleteBuffer(normalBuffer);
    normalBuffer = null;
  }
  
  if (indexBuffer != null)
  {
    gl.deleteBuffer(indexBuffer);
    indexBuffer = null;
  }
}

function main()
{
  // Initialize WebGL (can fail and return null).
  gl = initGL($("#canvas"));
  
  var GLSLScriptMode = ace.require("ace/mode/glsl").Mode;

  vertexShaderEditor = ace.edit("vertex-shader");
  vertexShaderEditor.getSession().setMode(new GLSLScriptMode());
  vertexShaderEditor.getSession().setValue(getSync("glsl/vertex.glsl"));

  fragmentShaderEditor = ace.edit("fragment-shader");
  fragmentShaderEditor.getSession().setMode(new GLSLScriptMode());
  fragmentShaderEditor.getSession().setValue(getSync("glsl/fragment.glsl"));

  $("#apply-button").click(reloadData);

  reloadData();
}

// vim: set sw=2 ts=2 et:
