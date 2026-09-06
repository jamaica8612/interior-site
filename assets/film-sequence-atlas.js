// Download compact sheets once; keep only nearby sheets decoded for drawing.
window.createFilmSequence = function ({ canvas, onFrame, onFailure }) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return null;
  const frames = 192, perSheet = 12, sheetCount = 16;
  const layouts = {
    mobile: { width:288, height:512, columns:3 },
    wide: { width:768, height:432, columns:4 }
  };
  let sheets = [], variant = '', generation = 0, controller;
  let target = 0, position = 0, focus = 0, direction = 1, displayed = -1;
  let width = 0, height = 0, activeFetches = 0, activeDecodes = 0;
  let animation = 0, previousTime = 0, suspended = false, disposed = false;
  const clamp = value => Math.max(0, Math.min(frames-1, value));
  const sheetAt = frame => Math.floor(Math.round(clamp(frame)) / perSheet);
  const decodeOrder = () => [...new Set([focus, sheetAt(target), focus+direction, focus-direction, focus+direction*2])]
    .filter(index => index >= 0 && index < sheetCount).slice(0,3);
  const release = entry => {
    if (entry.image) { entry.image.src = ''; entry.image = null; }
    if (entry.url) { URL.revokeObjectURL(entry.url); entry.url = null; }
  };
  const schedule = () => {
    if (!disposed && !suspended && !animation) animation = requestAnimationFrame(tick);
  };
  const draw = (frame, entry) => {
    const layout = layouts[variant], cell = frame % perSheet;
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const scale = Math.max(width/layout.width, height/layout.height);
    const w = layout.width*scale, h = layout.height*scale;
    context.drawImage(entry.image, (cell%layout.columns)*layout.width, Math.floor(cell/layout.columns)*layout.height,
      layout.width, layout.height, (width-w)/2, (height-h)/2, w, h);
    displayed = frame; onFrame();
  };
  const decode = () => {
    if (disposed) return;
    const wanted = decodeOrder();
    for (const entry of sheets) if (entry.image && !wanted.includes(entry.index)) release(entry);
    if (activeDecodes) return;
    const entry = wanted.map(index=>sheets[index]).find(item=>item.blob && !item.image && !item.decoding && !item.failed);
    if (!entry) return;
    const epoch = generation;
    entry.decoding = true; activeDecodes++;
    const image = new Image(), url = URL.createObjectURL(entry.blob);
    image.decoding = 'async'; image.src = url;
    image.decode().then(() => {
      if (disposed || epoch !== generation) { image.src=''; URL.revokeObjectURL(url); return; }
      entry.image = image; entry.url = url;
      // The target may have changed while the sheet was being decoded.
      if (!decodeOrder().includes(entry.index)) release(entry);
      schedule();
    }).catch(() => {
      image.src=''; URL.revokeObjectURL(url);
      if (!disposed && epoch === generation) { entry.failed = true; onFailure(); }
    }).finally(() => {
      if (disposed || epoch !== generation) return;
      entry.decoding = false; activeDecodes--; decode();
    });
  };
  const pump = () => {
    if (disposed) return;
    const wanted = decodeOrder();
    const order = [...wanted, ...sheets.map(entry=>entry.index).filter(index=>!wanted.includes(index))
      .sort((a,b)=>Math.abs(a-sheetAt(target))-Math.abs(b-sheetAt(target)))];
    while (activeFetches < 3) {
      const entry = order.map(index=>sheets[index]).find(item=>!item.blob && !item.fetching && !item.failed);
      if (!entry) break;
      const epoch = generation;
      entry.fetching = true; activeFetches++;
      fetch(`assets/entrance-atlas/${variant}-${String(entry.index).padStart(2,'0')}.webp`, {signal:controller.signal,cache:'force-cache'})
        .then(response=>{if(!response.ok)throw Error('Film sheet unavailable');return response.blob()})
        .then(blob=>{if(!disposed && epoch===generation){entry.blob=blob;decode();}})
        .catch(error=>{if(!disposed && epoch===generation && error.name!=='AbortError'){entry.failed=true;onFailure();}})
        .finally(()=>{if(!disposed && epoch===generation){entry.fetching=false;activeFetches--;pump();}});
    }
    decode();
  };
  function tick(now) {
    animation = 0;
    if (disposed || suspended) return;
    const dt = previousTime ? Math.min(40,Math.max(1,now-previousTime)) : 16;
    previousTime = now;
    let next = position + (target-position)*(1-Math.exp(-dt/95));
    if (Math.abs(target-next)<.15) next=target;
    const frame = Math.round(clamp(next));
    focus = sheetAt(frame); pump();
    const entry = sheets[focus];
    if (!entry?.image) { previousTime=0; return; }
    position = next;
    if (frame!==displayed || canvas.width!==width || canvas.height!==height) draw(frame,entry);
    if (Math.abs(target-position)>.01) schedule();
    else previousTime=0;
  }
  const render = (progress, {immediate=false}={}) => {
    if (disposed) return;
    const next = clamp(progress*(frames-1));
    if (next!==target) direction=Math.sign(next-target);
    target=next;
    if (immediate || suspended || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      position=target; focus=sheetAt(target); previousTime=0; displayed=-1;
    }
    suspended=false; pump(); schedule();
  };
  const resize = () => {
    const bounds=canvas.parentElement.getBoundingClientRect();
    if(!bounds.width || !bounds.height)return;
    const dpr=Math.min(window.devicePixelRatio||1,1.5);
    width=Math.round(bounds.width*dpr);height=Math.round(bounds.height*dpr);
    const nextVariant=bounds.width/bounds.height<.65?'mobile':'wide';
    if(nextVariant!==variant){
      generation++;controller?.abort();for(const entry of sheets)release(entry);
      variant=nextVariant;controller=new AbortController();activeFetches=activeDecodes=0;
      sheets=Array.from({length:sheetCount},(_,index)=>({index}));
      position=target;focus=sheetAt(target);displayed=-1;
    }
    pump();schedule();
  };
  const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);resize();
  return {
    render,
    hide(){suspended=true;cancelAnimationFrame(animation);animation=0;previousTime=0;displayed=-1;},
    dispose(){disposed=true;generation++;controller?.abort();observer.disconnect();cancelAnimationFrame(animation);for(const entry of sheets)release(entry);sheets=[];}
  };
};
