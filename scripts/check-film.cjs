const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sequenceCode=fs.readFileSync(path.join(root,'assets/film-sequence-atlas.js'),'utf8');
const tourCode=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].split('      const closeDetails')[0]+'\n})();';
const nodes=new Map(),raf=new Map(),requests=[],decodes=[],urls=new Map(),observers=[];
let serial=0,time=0,lastFrame=-1,maxNetwork=0,maxDecode=0,maxImages=0,draws=[];
let bounds={width:390,height:844};
function get(key){if(!nodes.has(key))nodes.set(key,element());return nodes.get(key)}
function element(){const handlers={},classes=new Set();return {
 duration:NaN,currentTime:0,value:'0',dataset:{src:'assets/entrance-flow.mp4'},paused:true,offsetTop:0,offsetHeight:800,style:{setProperty(){}},
 classList:{add(...v){v.forEach(x=>classes.add(x))},remove(...v){v.forEach(x=>classes.delete(x))},contains:v=>classes.has(v),toggle(v,on){on??=!classes.has(v);on?classes.add(v):classes.delete(v);return on}},
 addEventListener(t,fn){(handlers[t]??=[]).push(fn)},dispatchEvent(e){(handlers[e.type]??[]).forEach(fn=>fn(e))},
 emit(type,props={}){this.dispatchEvent({type,target:this,preventDefault(){},...props})},setAttribute(k,v){this[k]=v},querySelector:get,querySelectorAll:()=>[],focus(){},matches(){return false},closest(){return null},
 getBoundingClientRect:()=>bounds,play(){this.paused=false;this.emit('playing');return Promise.resolve()},pause(){this.paused=true}
}}
const images=[];
class AtlasImage{
 constructor(){images.push(this)}
 set src(value){this.url=value;if(value)this.sheet=urls.get(value);maxImages=Math.max(maxImages,images.filter(i=>i.url).length)}
 get src(){return this.url}
 decode(){return new Promise(resolve=>{decodes.push({image:this,resolve});maxDecode=Math.max(maxDecode,decodes.length)})}
}
const document={...element(),documentElement:element()};
const window={...element(),innerWidth:390,devicePixelRatio:3,scrollY:0,matchMedia:()=>({matches:false,addEventListener(){}}),scrollTo({top}){this.scrollY=top}};
const canvas=get('#entrance-frames');canvas.parentElement=get('#home-scene');
canvas.getContext=()=>({drawImage(image,sx,sy,sw,sh){const columns=image.sheet.variant==='mobile'?3:4;lastFrame=image.sheet.index*12+Math.round(sy/sh)*columns+Math.round(sx/sw);draws.push(lastFrame)}});
get('#walkthrough').offsetHeight=1680;
const context={window,document,location:{search:''},URLSearchParams,Event,AbortController,Image:AtlasImage,
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
 Object.defineProperty(film,'currentTime',{configurable:true,get:()=>0,set(){throw Error('Video seeking unavailable')}});
 assert.equal(document.documentElement.classList.contains('film-show-frames'),false);
 await drain();assert.equal(lastFrame,0);assert.equal(canvas.width,585);
 assert.equal(requests.length,16,'all compact sheets should be prefetched once');
 assert.equal(document.documentElement.classList.contains('film-show-frames'),true);
 scroll(.5);await step();await drain();assert.equal(lastFrame,96);
 scroll(.9);await step();scroll(.2);await step();await drain();assert.equal(lastFrame,38);
 draws=[];scroll(1);await step();await drain();assert.equal(lastFrame,191);
 assert.ok(draws.length>12,'scroll must ease through intermediate frames');
 assert.ok(draws.every((frame,i)=>!i||frame>=draws[i-1]),'late decodes must not reverse forward movement');
 scroll(0);await step();await drain();assert.equal(lastFrame,0);
 assert.equal(requests.length,16,'reverse scrolling must reuse downloaded blobs');
 assert.ok(maxNetwork<=3);assert.ok(maxDecode<=1);assert.ok(maxImages<=4,'decoded sheets exceeded memory bound: '+maxImages);
 let mediaTime=4;Object.defineProperty(film,'currentTime',{get:()=>mediaTime,set:v=>mediaTime=v});film.duration=8;
 scroll(.5);await step();await drain();window.allHomeTour.play(1);await microtasks();
 assert.equal(film.paused,false);assert.equal(document.documentElement.classList.contains('film-show-frames'),false);
 window.emit('resize');assert.equal(film.paused,false,'address bar changes must not stop playback');
 window.allHomeTour.stop();await drain();assert.equal(lastFrame,96,'native-to-scroll handoff must not show an old frame');
 bounds={width:844,height:390};window.innerWidth=844;window.emit('resize');observers.forEach(fn=>fn());await drain();
 assert.equal(lastFrame,96);assert.equal(requests.filter(r=>r.variant==='wide').length,16,'rotation must load wide compositions');
 const mobileBytes=fs.readdirSync(path.join(root,'assets/entrance-atlas')).filter(n=>n.startsWith('mobile-')).reduce((n,file)=>n+fs.statSync(path.join(root,'assets/entrance-atlas',file)).size,0);
 console.log('PASS: unavailable video seeking, prefetch, smooth/reversed/out-of-order scrubbing, native handoff, orientation, bounded decode/network. Mobile assets: '+mobileBytes+' bytes / 16 requests; peak live sheets: '+maxImages+'.');
})().catch(error=>{console.error(error);process.exitCode=1});
