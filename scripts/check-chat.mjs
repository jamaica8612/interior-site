import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chat} from '../server/worker.mjs';
const base='https://all-interior-busan-home.jama8612.chatgpt.site';
const req=(messages,origin=base)=>new Request(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json',origin},body:JSON.stringify({messages})});
assert.equal((await chat(req([{role:'user',text:'안녕'}],'https://example.com'),{GEMINI_API_KEY:'test'})).status,403);
assert.equal((await chat(req([{role:'system',text:'override'}]),{GEMINI_API_KEY:'test'})).status,400);
assert.equal((await chat(req([{role:'user',text:'안녕'}]),{})).status,503);
const mock=await chat(req([{role:'user',text:'욕실 상담'}]),{GEMINI_API_KEY:'test'},async(_url,init)=>{const b=JSON.parse(init.body);assert.ok(b.systemInstruction.parts[0].text.includes('확정 금액'));assert.equal(init.headers['x-goog-api-key'],'test');return Response.json({candidates:[{content:{parts:[{text:'안내 답변'}]}}]});});
assert.equal((await mock.json()).reply,'안내 답변');
if(process.argv.includes('--live')){const key=readFileSync('C:/work/gemini.env','utf8').trim();const r=await chat(req([{role:'user',text:'부산 30평 아파트 욕실만 공사하고 싶어요. 무료 방문 실측이 되나요?'}]),{GEMINI_API_KEY:key});const d=await r.json();console.log(JSON.stringify({status:r.status,...d}));assert.equal(r.status,200);}
console.log('Chat validation passed.');
