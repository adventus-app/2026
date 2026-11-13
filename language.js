let table=null,getScript=()=> 't',observer=null;
const originals=new WeakMap(),attrs=new WeakMap();
export function convert(text,script=getScript()){
 if(script!=='s'||!table)return String(text);
 return String(text).replace(table.re,x=>table.phrases[x]||table.chars[x]||x);
}
function watch(){observer?.observe(document.body,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});}
export function refreshLanguage(){
 observer?.disconnect();
 document.documentElement.lang=getScript()==='s'?'zh-Hans':'zh-Hant';
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('script,style,textarea,[data-no-convert]')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 for(let n=walker.nextNode();n;n=walker.nextNode()){
  if(!originals.has(n))originals.set(n,n.nodeValue);
  const translated=convert(originals.get(n));if(n.nodeValue!==translated)n.nodeValue=translated;
 }
 document.querySelectorAll('[aria-label],[placeholder],[title]').forEach(el=>{
  if(el.closest('[data-no-convert]'))return;
  let original=attrs.get(el);if(!original){original={};attrs.set(el,original);}
  for(const name of ['aria-label','placeholder','title']){if(!el.hasAttribute(name))continue;const current=el.getAttribute(name);if(!original[name]||current!==original[name].converted)original[name]={text:current,converted:current};const next=convert(original[name].text);original[name].converted=next;if(current!==next)el.setAttribute(name,next);}
 });
 document.querySelectorAll('[data-script-choice]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.scriptChoice===getScript()?'true':'false'));
 watch();
}
export async function initLanguage(script){
 getScript=script;
 try{const response=await fetch('./t2s.json');if(!response.ok)throw Error('conversion');const data=await response.json();const phrases=Object.keys(data.p).sort((a,b)=>b.length-a.length).map(p=>p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));table={chars:data.c,phrases:data.p,re:new RegExp(phrases.join('|')+'|[\\u3400-\\u9fff]','g')};}
 catch{return false;}
 observer=new MutationObserver(refreshLanguage);refreshLanguage();return true;
}
