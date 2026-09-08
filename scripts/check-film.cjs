const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const scenario=process.argv[2]||'standard';
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sequenceCode=fs.readFileSync(path.join(root,'assets/film-sequence-gpu.js'),'utf8');
const tourCode=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].split('      const closeDetails')[0]+'\n})();';
const nodes=new Map(),raf=new Map(),requests=[],decodes=[],urls=new Map(),observers=[];
let serial=0,time=0,lastFrame=-1,maxNetwork=0,maxDecode=0,maxImages=0,draws=[],uploads=0,layoutReads=0;
const textures=new Set();let maxTextures=0,boundTexture,cell;
let bounds={width:390,height:844};
function get(key){if(!nodes.has(key))nodes.set(key,{...element(),key});return nodes.get(key)}
function element(){const handlers={},classes=new Set();return {
 duration:NaN,currentTime:0,value:'0',dataset:{src:'assets/entrance-flow.mp4'},paused:true,offsetTop:0,offsetHeight:800,style:{setProperty(){}},
 classList:{add(...v){v.forEach(x=>classes.add(x))},remove(...v){v.forEach(x=>classes.delete(x))},contains:v=>classes.has(v),toggle(v,on){on??=!classes.has(v);on?classes.add(v):classes.delete(v);return on}},
 addEventListener(t,fn){(handlers[t]??=[]).push(fn)},removeEventListener(t,fn){handlers[t]=(handlers[t]||[]).filter(f=>f!==fn)},dispatchEvent(e){(handlers[e.type]??[]).forEach(fn=>fn(e))},
 emit(type,props={}){this.dispatchEvent({type,target:this,preventDefault(){},...props})},setAttribute(k,v){this[k]=v},querySelector:get,querySelectorAll:()=>[],focus(){},matches(){return false},closest(){return null},
 getBoundingClientRect(){layoutReads++;return {...bounds,top:this.key==='#walkthrough'?-window.scrollY:0}},play(){this.paused=false;this.emit('playing');return Promise.resolve()},pause(){this.paused=true}
}}
const images=[];
class AtlasImage{
 constructor(){images.push(this)}
 set src(value){this.url=value;if(value){this.sheet=urls.get(value);this.naturalWidth=this.sheet.variant==='mobile'?864:2048;this.naturalHeight=this.sheet.variant==='mobile'?2048:864;}maxImages=Math.max(maxImages,images.filter(i=>i.url).length)}
 get src(){return this.url}
 decode(){return new Promise(resolve=>{decodes.push({image:this,resolve});maxDecode=Math.max(maxDecode,decodes.length)})}
}
const document={...element(),documentElement:element()};
const window={...element(),innerWidth:390,devicePixelRatio:3,scrollY:0,matchMedia:()=>({matches:false,addEventListener(){}}),scrollTo({top}){this.scrollY=top}};
const canvas=get('#entrance-frames');canvas.parentElement=get('#home-scene');
const gl={
 VERTEX_SHADER:1,FRAGMENT_SHADER:2,HIGH_FLOAT:3,COMPILE_STATUS:4,LINK_STATUS:5,NO_ERROR:0,MAX_TEXTURE_SIZE:6,
 createShader:()=>({}),shaderSource(){},compileShader(){},getShaderParameter:()=>true,deleteShader(){},getShaderPrecisionFormat:()=>({precision:23}),
 createProgram:()=>({}),attachShader(){},linkProgram(){},getProgramParameter:()=>true,useProgram(){},deleteProgram(){},
 createBuffer:()=>({}),bindBuffer(){},bufferData(){},deleteBuffer(){},getAttribLocation:()=>0,enableVertexAttribArray(){},vertexAttribPointer(){},
 getUniformLocation:(p,n)=>n,uniform1i(){},activeTexture(){},disable(){},pixelStorei(){},viewport(){},uniform2f(){},
 uniform4f(location,...value){cell=value},createTexture(){const t={};textures.add(t);maxTextures=Math.max(maxTextures,textures.size);return t},
 deleteTexture(t){textures.delete(t)},bindTexture(type,t){boundTexture=t},texParameteri(){},getError:()=>0,getParameter:()=>4096,flush(){},
 texImage2D(...args){boundTexture.sheet=args.at(-1).sheet;uploads++},
 drawArrays(){assert.equal(textures.size,16,'All textures must be ready before scrubbing');const {index,variant}=boundTexture.sheet;const cols=variant==='mobile'?3:4,rows=12/cols;lastFrame=index*12+Math.floor(cell[1]*rows+.001)*cols+Math.floor(cell[0]*cols+.001);draws.push(lastFrame)}
};
canvas.getContext=()=>scenario==='unsupported'?null:gl;
get('#walkthrough').offsetHeight=1680;
const context={window,document,location:{search:''},URLSearchParams,Event,AbortController,Image:AtlasImage,queueMicrotask,Float32Array,
 URL:{createObjectURL(blob){const url='blob:test/'+(++serial);urls.set(url,blob);return url},revokeObjectURL(url){urls.delete(url)}},
 fetch(url,{signal}){return new Promise((resolve,reject)=>{const match=url.match(/(mobile|wide)-(\d+)\.webp$/);const request={variant:match[1],index:Number(match[2]),resolve,reject,done:false};requests.push(request);maxNetwork=Math.max(maxNetwork,requests.filter(r=>!r.done).length);signal.addEventListener('abort',()=>{if(!request.done){request.done=true;reject(Object.assign(Error('abort'),{name:'AbortError'}))}})})},
 ResizeObserver:class{constructor(fn){observers.push(fn)}observe(){}disconnect(){}},performance:{now:()=>time},setTimeout:fn=>fn(),
 requestAnimationFrame(fn){const id=++serial;raf.set(id,fn);return id},cancelAnimationFrame:id=>raf.delete(id)};
vm.createContext(context);vm.runInContext(sequenceCode,context);vm.runInContext(tourCode,context);
async function microtasks(){for(let i=0;i<12;i++)await Promise.resolve()}
function completeRequest(request){request.done=true;request.resolve({ok:true,blob:()=>Promise.resolve({variant:request.variant,index:request.index})})}
async function step(){time+=16;const work=[...raf.values()];raf.clear();work.forEach(fn=>fn(time));await microtasks()}
async function drain(){for(let i=0;i<160;i++){
 for(const r of requests.filter(r=>!r.done))completeRequest(r);await microtasks();
 for(const d of decodes.splice(0))d.resolve();await microtasks();await step();
 if(!raf.size&&!decodes.length&&!requests.some(r=>!r.done))return;
}throw Error('Animation/load pipeline did not settle')}
function scroll(p){window.scrollY=p*880;window.emit('scroll')}
(async()=>{
 const film=get('#entrance-film');
 if(scenario==='lifecycle') {
  film.duration=8;let rejectPlay;film.play=()=>new Promise((resolve,reject)=>{rejectPlay=reject});
  scroll(.5);await step();window.allHomeTour.play(1);await drain();
  assert.equal(draws.length,0,'Preparing during a pending native play must remain suspended');
  rejectPlay(Error('Playback unavailable'));await microtasks();await drain();
  assert.equal(lastFrame,96);assert.equal(document.documentElement.classList.contains('film-show-frames'),true);
  window.allHomeTour.play(1);window.allHomeTour.stop();await drain();film.emit('playing');
  assert.equal(document.documentElement.classList.contains('film-show-frames'),true,'Late playing events must not hide resumed scroll');
  assert.equal(film.paused,true);console.log('PASS: readiness during pending playback, rejected playback, cancel and late playing event.');return;
 }
 if(scenario==='unsupported'||scenario==='load-failure') {
  if(scenario==='load-failure'){requests[0].done=true;requests[0].resolve({ok:false})}
  await microtasks();await drain();assert.equal(draws.length,0);assert.equal(textures.size,0);
  assert.equal(document.documentElement.classList.contains('film-show-frames'),false);
  assert.match(get('#tour-status').textContent,/영상 재생/);
  film.duration=8;window.allHomeTour.play(1);await microtasks();assert.equal(film.paused,false);window.allHomeTour.stop();
  console.log('PASS: '+scenario+' preserves usable native video fallback.');return;
 }
 if(scenario==='rotation-loading') {
  for(let i=0;i<8;i++){for(const r of requests.filter(r=>!r.done))completeRequest(r);await microtasks()}
  assert.equal(decodes.length,1);
  bounds={width:844,height:390};window.innerWidth=844;window.emit('resize');observers.forEach(fn=>fn());await drain();
  assert.equal(uploads,16,'Old orientation finishing decode must not upload stale textures');assert.equal(lastFrame,0);assert.equal(maxTextures,16);
  console.log('PASS: orientation change during decode cancels stale preparation.');return;
 }
 Object.defineProperty(film,'currentTime',{configurable:true,get:()=>0,set(){throw Error('Video seeking unavailable')}});
 assert.equal(document.documentElement.classList.contains('film-show-frames'),false);
 scroll(.5);await step();assert.equal(draws.length,0,'Do not expose partially ready textures');
 await drain();assert.equal(lastFrame,96);assert.equal(canvas.width,585);assert.equal(uploads,16);assert.equal(urls.size,0);
 assert.equal(requests.length,16,'all compact sheets should be prefetched once');
 assert.equal(document.documentElement.classList.contains('film-show-frames'),true);
 const reads=layoutReads;
 scroll(.9);await step();scroll(.2);await step();await drain();assert.equal(lastFrame,38);
 draws=[];scroll(1);await step();await drain();assert.equal(lastFrame,191);
 assert.ok(draws.length>12,'scroll must ease through intermediate frames');
 assert.ok(draws.every((frame,i)=>!i||frame>=draws[i-1]),'late decodes must not reverse forward movement');
 scroll(0);await step();await drain();assert.equal(lastFrame,0);
 assert.equal(requests.length,16,'reverse scrolling must reuse downloaded blobs');
 assert.equal(uploads,16,'No GPU uploads during forward/reverse scrubbing');assert.equal(decodes.length,0);assert.equal(layoutReads,reads);
 assert.ok(maxNetwork<=3);assert.equal(maxDecode,1);assert.equal(maxImages,1);assert.equal(maxTextures,16);
 let mediaTime=4;Object.defineProperty(film,'currentTime',{get:()=>mediaTime,set:v=>mediaTime=v});film.duration=8;
 scroll(.5);await step();await drain();window.allHomeTour.play(1);await microtasks();
 assert.equal(film.paused,false);assert.equal(document.documentElement.classList.contains('film-show-frames'),false);
 window.emit('resize');assert.equal(film.paused,false,'address bar changes must not stop playback');
 window.allHomeTour.stop();await drain();assert.equal(lastFrame,96,'native-to-scroll handoff must not show an old frame');
 bounds={width:844,height:390};window.innerWidth=844;window.emit('resize');observers.forEach(fn=>fn());await drain();
 assert.equal(lastFrame,96);assert.equal(requests.filter(r=>r.variant==='wide').length,16,'rotation must load wide compositions');
 assert.equal(uploads,32);assert.equal(maxTextures,16,'Orientation must release old textures before new allocation');
 canvas.emit('webglcontextlost');await microtasks();assert.equal(textures.size,0);assert.equal(document.documentElement.classList.contains('film-show-frames'),false);
 window.allHomeTour.play(1);await microtasks();assert.equal(film.paused,false,'Context loss must preserve native fallback');window.allHomeTour.stop();
 const mobileBytes=fs.readdirSync(path.join(root,'assets/forena-gpu')).filter(n=>n.startsWith('mobile-')).reduce((n,file)=>n+fs.statSync(path.join(root,'assets/forena-gpu',file)).size,0);
 console.log('PASS: complete readiness; no decode/upload/network/layout reads during scrubbing; forward/reverse motion; native handoff; orientation; context-loss fallback. Mobile '+mobileBytes+' bytes / 16 textures / 108 MiB GPU; one live CPU image. Mock checks only, no physical phone FPS measurement.');
})().catch(error=>{console.error(error);process.exitCode=1});
