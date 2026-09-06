// Prepare every texture before scrubbing: no image decode/upload in the draw loop.
window.createFilmSequence = function ({ canvas, onFrame, onFailure, onReady, onLoading }) {
  const gl = canvas.getContext('webgl', { alpha:false, antialias:false, depth:false,
    stencil:false, preserveDrawingBuffer:false, powerPreference:'low-power' });
  if (!gl) { queueMicrotask(() => onFailure?.()); return null; }
  const frameCount=192, perSheet=12, sheetCount=16;
  const layouts={mobile:{width:288,height:512,columns:3},wide:{width:512,height:288,columns:4}};
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let textures=[], variant='', epoch=0, controller, observer, program, buffer;
  let frameUniform, cropUniform, target=0, position=0, displayed=-1;
  let width=0, height=0, animation=0, previousTime=0;
  let ready=false, suspended=false, disposed=false, failed=false, shown=false;
  const clamp=p=>Math.max(0,Math.min(frameCount-1,p));
  const releaseTextures=()=>{for(const texture of textures)if(texture)gl.deleteTexture(texture);textures=[];};
  const fail=()=>{
    if(disposed||failed)return;
    failed=true;ready=false;epoch++;controller?.abort();cancelAnimationFrame(animation);animation=0;
    releaseTextures();queueMicrotask(() => { if(!disposed)onFailure?.(); });
  };
  function shader(type,source) {
    const result=gl.createShader(type);gl.shaderSource(result,source);gl.compileShader(result);
    if(!gl.getShaderParameter(result,gl.COMPILE_STATUS)){gl.deleteShader(result);throw Error('Film shader unavailable');}
    return result;
  }
  try {
    const vertex=shader(gl.VERTEX_SHADER,`attribute vec2 point;
      varying vec2 uv;
      void main(){ uv=vec2((point.x+1.0)*0.5,(1.0-point.y)*0.5); gl_Position=vec4(point,0.0,1.0); }`);
    const precision=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT).precision?'highp':'mediump';
    const fragment=shader(gl.FRAGMENT_SHADER,`precision ${precision} float;
      uniform sampler2D sheet; uniform vec4 cell; uniform vec2 crop; varying vec2 uv;
      void main(){ vec2 local=(uv-0.5)*crop+0.5; gl_FragColor=texture2D(sheet,cell.xy+local*cell.zw); }`);
    program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    gl.deleteShader(vertex);gl.deleteShader(fragment);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Film program unavailable');
    gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const point=gl.getAttribLocation(program,'point');gl.enableVertexAttribArray(point);gl.vertexAttribPointer(point,2,gl.FLOAT,false,0,0);
    frameUniform=gl.getUniformLocation(program,'cell');cropUniform=gl.getUniformLocation(program,'crop');
    gl.uniform1i(gl.getUniformLocation(program,'sheet'),0);gl.activeTexture(gl.TEXTURE0);
    gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  } catch { queueMicrotask(fail); }
  const schedule=()=>{if(!disposed&&!failed&&ready&&!suspended&&!animation)animation=requestAnimationFrame(tick);};
  function draw(frame) {
    const layout=layouts[variant], rows=perSheet/layout.columns, cell=frame%perSheet;
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
    const scale=Math.max(width/layout.width,height/layout.height);
    gl.uniform2f(cropUniform,width/(layout.width*scale),height/(layout.height*scale));
    // Half-texel inset prevents an adjacent atlas frame bleeding into the crop.
    const sheetWidth=layout.width*layout.columns, sheetHeight=layout.height*rows;
    gl.uniform4f(frameUniform,((cell%layout.columns)*layout.width+.5)/sheetWidth,
      (Math.floor(cell/layout.columns)*layout.height+.5)/sheetHeight,
      (layout.width-1)/sheetWidth,(layout.height-1)/sheetHeight);
    gl.bindTexture(gl.TEXTURE_2D,textures[Math.floor(frame/perSheet)]);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);displayed=frame;
    if(!shown){shown=true;onFrame?.();}
  }
  function tick(now) {
    animation=0;if(disposed||failed||!ready||suspended)return;
    const dt=previousTime?Math.min(40,Math.max(1,now-previousTime)):16;previousTime=now;
    position+=(target-position)*(1-Math.exp(-dt/80));
    if(Math.abs(target-position)<.1)position=target;
    const frame=Math.round(clamp(position));
    if(frame!==displayed||canvas.width!==width||canvas.height!==height)draw(frame);
    if(Math.abs(target-position)>.01)schedule();else previousTime=0;
  }
  async function prepare(generation,layout) {
    const signal=controller.signal, blobs=new Array(sheetCount);
    const current=()=>!disposed&&!failed&&epoch===generation;
    let next=0, downloaded=0;
    // Bounded transfer; all CPU images are decoded and discarded one at a time below.
    const worker=async()=>{while(next<sheetCount&&current()){
      const index=next++;
      const response=await fetch(`assets/entrance-gpu/${variant}-${String(index).padStart(2,'0')}.webp`,{signal,cache:'force-cache'});
      if(!response.ok)throw Error('Film sheet unavailable');
      const blob=await response.blob();if(!current())return;blobs[index]=blob;
      onLoading?.(Math.round(++downloaded/sheetCount*45));
    }};
    try {
      await Promise.all([worker(),worker(),worker()]);if(!current())return;
      for(let index=0;index<sheetCount;index++){
        if(!current())return;
        const image=new Image(), url=URL.createObjectURL(blobs[index]);image.decoding='async';
        try {
          image.src=url;await image.decode();if(!current())return;
          if(image.naturalWidth!==layout.width*layout.columns||image.naturalHeight!==layout.height*(perSheet/layout.columns))throw Error('Film sheet dimensions changed');
          const texture=gl.createTexture();textures[index]=texture;gl.bindTexture(gl.TEXTURE_2D,texture);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
          gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
          if(gl.getError()!==gl.NO_ERROR)throw Error('Film texture allocation failed');
          gl.flush();onLoading?.(45+Math.round((index+1)/sheetCount*55));
        } finally {image.src='';URL.revokeObjectURL(url);blobs[index]=null;}
        // Give the browser time to present the static page between uploads.
        await new Promise(resolve=>requestAnimationFrame(resolve));
      }
      if(!current())return;
      ready=true;onReady?.();schedule();
    } catch(error){if(current()&&error.name!=='AbortError')fail();}
  }
  function resize() {
    if(disposed||failed)return;
    const bounds=canvas.parentElement.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
    // A 108 MiB texture budget for either orientation; no mipmaps or duplicate bitmaps.
    const nextVariant=bounds.width/bounds.height<.65?'mobile':'wide', layout=layouts[nextVariant];
    const dpr=Math.min(window.devicePixelRatio||1,1.5,1440/Math.max(bounds.width,bounds.height));
    width=Math.max(1,Math.round(bounds.width*dpr));height=Math.max(1,Math.round(bounds.height*dpr));
    if(nextVariant!==variant){
      if(Math.max(layout.width*layout.columns,layout.height*perSheet/layout.columns)>gl.getParameter(gl.MAX_TEXTURE_SIZE)){fail();return;}
      epoch++;controller?.abort();releaseTextures();controller=new AbortController();variant=nextVariant;
      ready=false;displayed=-1;previousTime=0;shown=false;onLoading?.(0);prepare(epoch,layout);
    }
    schedule();
  }
  const lost=event=>{event.preventDefault();fail();};canvas.addEventListener('webglcontextlost',lost);
  const visible=()=>{if(!document.hidden){displayed=-1;schedule();}};
  document.addEventListener('visibilitychange',visible);
  observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);resize();
  return {
    render(progress,{immediate=false}={}){
      if(disposed||failed)return;target=clamp(progress*(frameCount-1));
      if(immediate||suspended||reduced.matches){position=target;previousTime=0;displayed=-1;}
      suspended=false;schedule();
    },
    hide(){suspended=true;shown=false;cancelAnimationFrame(animation);animation=0;previousTime=0;displayed=-1;},
    dispose(){disposed=true;epoch++;controller?.abort();observer.disconnect();cancelAnimationFrame(animation);
      canvas.removeEventListener('webglcontextlost',lost);document.removeEventListener('visibilitychange',visible);
      releaseTextures();if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);}
  };
};
