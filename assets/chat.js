(()=>{
 const dialog=document.querySelector('#ai-dialog'),log=document.querySelector('#ai-log'),form=document.querySelector('#ai-form'),input=document.querySelector('#ai-input'),status=document.querySelector('#ai-status'),send=document.querySelector('#ai-send');let messages=[],busy=false;
 const add=(text,role)=>{const p=document.createElement('p');p.className='ai-message '+role;p.textContent=text;log.append(p);log.scrollTop=log.scrollHeight;};
 document.querySelector('#ai-launch').addEventListener('click',()=>dialog.showModal());document.querySelector('#ai-close').addEventListener('click',()=>dialog.close());
 document.querySelectorAll('[data-ai-question]').forEach(b=>b.addEventListener('click',()=>{input.value=b.textContent;input.focus();}));
 form.addEventListener('submit',async e=>{e.preventDefault();const text=input.value.trim();if(!text||busy)return;busy=true;send.disabled=true;input.value='';add(text,'user');status.textContent='답변을 정리하고 있어요…';const next=[...messages,{role:'user',text}].slice(-7);
 try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:next}),signal:AbortSignal.timeout(25000)});const d=await r.json();if(!r.ok||!d.reply)throw Error(d.error||'AI 연결을 확인해주세요.');add(d.reply,'model');messages=[...next,{role:'model',text:d.reply}].slice(-6);status.textContent='';}catch(err){status.textContent=err.name==='TimeoutError'?'응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.':err.message;input.value=text;}finally{busy=false;send.disabled=false;}
 });
})();
