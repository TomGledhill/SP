function getSync(url)
{
  var val = null;

  $.ajax({
    'async': false,
    'global': false,
    'url': url,
    'success': function(data) {
      val = data;
    }
  });

  return val;
};


function rawStringToBuffers(str, vertlen, normlen, facetlen)
{
  var vertarr = new Array(vertlen * 3);
  var normarr = new Array(normlen * 3);
  var facetarr = new Array(facetlen * 3);

  var idx, curind, curvertstr;
  // make vertex buffer
  for (idx = 0; idx < vertlen * 3; idx += 3) 
  {
    curind = str.indexOf("v ", ++curind);
    curvertstr = str.substr(curind + 2, 100).split(/\n/, 1);
    curvertstr = curvertstr.toString().split(" ", 3);
    vertarr[idx] = parseFloat(curvertstr[0]);
    vertarr[idx + 1] = parseFloat(curvertstr[1]);
    vertarr[idx + 2] = parseFloat(curvertstr[2]);
  }  

  // make normal buffer  
  for (idx = 0; idx < normlen * 3; idx += 3) 
  {
    curind = str.indexOf("vn ", ++curind);
    curvertstr = str.substr(curind + 3, 100).split(/\n/, 1);
    curvertstr = curvertstr.toString().split(" ", 3);
    normarr[idx] = parseFloat(curvertstr[0]);
    normarr[idx + 1] = parseFloat(curvertstr[1]);
    normarr[idx + 2] = parseFloat(curvertstr[2]);
  }  

  // make facet indices buffer
  for (idx = 0; idx < facetlen * 3; idx += 3) 
  {
    curind = str.indexOf("f ", ++curind);
    curvertstr = str.substr(curind + 2, 100).split(/\n/, 1);
    curvertstr = curvertstr.toString().split(" ", 3);
    facetarr[idx] = parseInt(curvertstr[0].split("/", 3)) - 1;
    facetarr[idx + 1] = parseInt(curvertstr[1].split("/", 3)) - 1;
    facetarr[idx + 2] = parseInt(curvertstr[2].split("/", 3)) - 1;
  }  
  
  // You may create an ArrayBuffer from a standard array (of values) as follows:
  //return [new Uint8Array(vertarr).buffer, new Uint8Array(normarr).buffer, new Uint8Array(facetarr).buffer];
  return [vertarr, normarr, facetarr];
}

// vim: set sw=2 ts=2 et:
