const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sequenceCode = fs.readFileSync(path.join(root, 'assets/film-sequence.js'), 'utf8');
const tourCode = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].split('      const closeDetails')[0] + '\n})();';
const nodes = new Map(), images = [], raf = new Map();
let frameId = 0, lastDraw = -1, maxActive = 0, maxRetained = 0;
function get(selector) { if (!nodes.has(selector)) nodes.set(selector, element()); return nodes.get(selector); }
function element() {
  const handlers = {}, classes = new Set();
  return {
    duration: NaN, currentTime: 0, value:'0', dataset:{src:'assets/entrance-flow.mp4'}, paused:true,
    offsetTop:0, offsetHeight:800, clientWidth:390, style:{setProperty(){}},
    classList:{add(...v){v.forEach(x=>classes.add(x))},remove(...v){v.forEach(x=>classes.delete(x))},contains(v){return classes.has(v)},toggle(v,on){on??=!classes.has(v);on?classes.add(v):classes.delete(v);return on}},
    addEventListener(type,fn){(handlers[type]??=[]).push(fn)},
    dispatchEvent(event){(handlers[event.type]??[]).forEach(fn=>fn(event))},
    emit(type,props={}){this.dispatchEvent({type,target:this,preventDefault(){},...props})},
    setAttribute(k,v){this[k]=v},querySelector:get,querySelectorAll:()=>[],focus(){},matches(){return false},closest(){return null},
    getBoundingClientRect:()=>({width:390,height:844}),
    play(){this.paused=false;this.emit('playing');return Promise.resolve()},pause(){this.paused=true}
  };
}
class FrameImage {
  constructor(){this.naturalWidth=960;this.naturalHeight=540;images.push(this)}
  set src(value){this.url=value;if(value){this.index=Number(value.match(/frame-(\d+)/)[1]);this.pending=true}else this.pending=false;
    maxActive=Math.max(maxActive,images.filter(i=>i.pending).length);
    maxRetained=Math.max(maxRetained,images.filter(i=>i.url).length);
  }
  get src(){return this.url}
}
const document={...element(),documentElement:element()};
const window={...element(),innerWidth:390,devicePixelRatio:3,scrollY:0,
  matchMedia:()=>({matches:false,addEventListener(){}}),scrollTo({top}){this.scrollY=top}};
const canvas=get('#entrance-frames');canvas.parentElement=get('#home-scene');
canvas.getContext=()=>({drawImage(image){lastDraw=image.index}});
get('#walkthrough').offsetHeight=1680;
const context={window,document,location:{search:''},URLSearchParams,Event,Image:FrameImage,
  ResizeObserver:class{observe(){}disconnect(){}},performance:{now:()=>0},setTimeout:fn=>fn(),
  requestAnimationFrame(fn){raf.set(++frameId,fn);return frameId},cancelAnimationFrame:id=>raf.delete(id)};
vm.createContext(context);vm.runInContext(sequenceCode,context);vm.runInContext(tourCode,context);
function resolveImage(index){const img=images.find(i=>i.pending&&i.index===index);if(!img)return false;img.pending=false;img.onload?.();return true}
function drain(){let remaining=100;while(images.some(i=>i.pending)&&remaining--){const i=images.find(i=>i.pending);i.pending=false;i.onload?.()}assert.ok(remaining>0,'load queue must settle')}
function scroll(progress){window.scrollY=progress*880;window.emit('scroll');const pending=[...raf.values()];raf.clear();pending.forEach(fn=>fn(16))}
(async()=>{
  // Model a mobile browser with no video metadata or usable currentTime setter.
  const film=get('#entrance-film');
  Object.defineProperty(film,'currentTime',{get:()=>0,set(){throw Error('Video seeking unavailable')}});
  assert.equal(document.documentElement.classList.contains('film-show-frames'),false);
  resolveImage(0);assert.equal(lastDraw,0);
  assert.equal(document.documentElement.classList.contains('film-show-frames'),true);
  scroll(.5);drain();assert.equal(lastDraw,96,'scroll must work without any video readiness');
  scroll(.8);scroll(.2);drain();assert.equal(lastDraw,38,'late loads must settle on the newest target');
  for(let p=0;p<=1;p+=.02){scroll(p);drain()}
  scroll(1);drain();assert.equal(lastDraw,191);
  scroll(0);drain();assert.equal(lastDraw,0,'reverse scroll closes the same door');
  assert.ok(maxActive<=4,`unbounded concurrent images: ${maxActive}`);
  assert.ok(maxRetained<=24,`unbounded decoded image retention: ${maxRetained}`);
  assert.equal(canvas.width,585,'canvas DPR must be capped on high-DPR phones');
  window.allHomeTour.play(1);await Promise.resolve();assert.equal(film.paused,false);
  window.emit('resize');assert.equal(film.paused,false,'address-bar height changes must not pause playback');
  window.innerWidth=844;window.emit('resize');assert.equal(film.paused,true,'orientation changes stop the previous playback geometry');
  console.log('PASS: scrolling without video seeking; out-of-order images; both directions; bounded requests/memory; mobile DPR; toolbar resize; orientation change.');
})().catch(error=>{console.error(error);process.exitCode=1});
