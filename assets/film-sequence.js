// Scroll frames come from the same Flow film, without depending on video seeking.
window.createFilmSequence = function ({ canvas, onFrame, onFailure }) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return null;
  const count = 192, anchors = [0,48,96,144,191], cache = new Map(), failed = new Set();
  let wanted = 0, displayed = -1, direction = 1, active = 0, disposed = false;
  let queue = [], width = 0, height = 0, hasPainted = false;
  const indexAt = progress => Math.round(Math.max(0, Math.min(1, progress)) * (count - 1));
  const draw = (index, image) => {
    const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const w = image.naturalWidth * ratio, h = image.naturalHeight * ratio;
    context.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
    displayed = index; hasPainted = true; onFrame();
  };
  const present = () => {
    if (disposed || !width || !height) return;
    let best = cache.get(wanted)?.ready ? wanted : -1;
    if (best < 0 && displayed >= 0) {
      for (const [index, entry] of cache) {
        if (!entry.ready || Math.abs(index-wanted) >= Math.abs(displayed-wanted)) continue;
        if (best < 0 || Math.abs(index-wanted) < Math.abs(best-wanted)) best = index;
      }
    }
    if (best >= 0 && best !== displayed) draw(best, cache.get(best).image);
  };
  const trim = () => {
    const removable = [...cache.keys()].filter(index => cache.get(index).ready && index !== wanted && index !== displayed && !anchors.includes(index))
      .sort((a,b) => Math.abs(b-wanted) - Math.abs(a-wanted));
    while (cache.size > 20 && removable.length) {
      const index = removable.shift(), entry = cache.get(index);
      entry.image.onload = entry.image.onerror = null;
      entry.image.src = ''; cache.delete(index);
    }
  };
  const pump = () => {
    if (disposed) return;
    while (active < 4 && queue.length) {
      const index = queue.shift();
      if (cache.has(index) || failed.has(index)) continue;
      const image = new Image();
      const entry = { image, ready: false };
      cache.set(index, entry); active++;
      image.decoding = 'async';
      image.onload = () => {
        active--; entry.ready = true;
        if (disposed) return;
        present(); trim(); pump();
      };
      image.onerror = () => {
        active--; cache.delete(index); failed.add(index);
        if (disposed) return;
        if (!hasPainted && index === wanted) onFailure();
        pump();
      };
      image.src = `assets/entrance-frames/frame-${String(index).padStart(3,'0')}.webp`;
    }
  };
  const render = progress => {
    if (disposed) return;
    const next = indexAt(progress);
    if (next !== wanted) direction = Math.sign(next - wanted);
    wanted = next;
    // Rebuild the queue so rapid scrolling loads the latest target first.
    queue = [wanted];
    for (let step = 1; step <= 3; step++) queue.push(wanted + direction*step, wanted - direction*step);
    queue.push(...anchors);
    queue = [...new Set(queue)].filter(index => index >= 0 && index < count && !cache.has(index) && !failed.has(index));
    present(); trim(); pump();
  };
  const resize = () => {
    const bounds = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const nextWidth = Math.round(bounds.width*dpr), nextHeight = Math.round(bounds.height*dpr);
    if (nextWidth === width && nextHeight === height) return;
    width = canvas.width = nextWidth; height = canvas.height = nextHeight;
    const entry = cache.get(displayed);
    if (entry?.ready) draw(displayed,entry.image);
    else { displayed = -1; present(); }
  };
  const observer = new ResizeObserver(resize); observer.observe(canvas.parentElement);
  resize(); render(0);
  return {
    render,
    hide() { displayed = -1; },
    dispose() {
      disposed = true; observer.disconnect(); queue = [];
      for (const {image} of cache.values()) { image.onload = image.onerror = null; image.src = ''; }
      cache.clear();
    }
  };
};
