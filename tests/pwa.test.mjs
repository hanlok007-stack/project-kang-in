import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
const origin='https://game.example/';
function response(url,html=false,overrides={}){
  return {ok:true,type:'basic',redirected:false,url,headers:new Headers({'content-type':html?'text/html':'application/octet-stream'}),clone(){return this;},async text(){return html?'<body data-app-id="kang-in">game</body>':'asset';},...overrides};
}
function runtime(fetchOverride){
  const stores=new Map(),listeners={},calls=[];
  let skips=0,claims=0;
  const caches={
    async open(name){if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return {async put(url,value){data.set(typeof url==='string'?url:url.url,value);},async match(url){return data.get(typeof url==='string'?url:url.url);}};},
    async match(url,{cacheName}={}){return stores.get(cacheName)?.get(url);},
    async delete(name){return stores.delete(name);},async keys(){return [...stores.keys()];}
  };
  runInNewContext(source,{URL,Set,Promise,Response,caches,fetch:async(url,options)=>{calls.push(url);return fetchOverride?fetchOverride(url,options):response(url,url===origin);},self:{registration:{scope:origin},clients:{async claim(){claims++;}},async skipWaiting(){skips++;},addEventListener(type,fn){listeners[type]=fn;}}});
  return {stores,calls,async event(type,payload={}){let promise;listeners[type]({...payload,waitUntil:p=>promise=p,respondWith:p=>promise=p});return await promise;},get skips(){return skips;},get claims(){return claims;}};
}

test('complete app shell is available offline; activation preserves unrelated caches',async()=>{
  const rt=runtime();rt.stores.set('kang-in-old',new Map());rt.stores.set('another-app',new Map());
  await rt.event('install');
  assert.equal(rt.stores.get('kang-in-dev-v3').size,7);
  assert.equal(rt.skips,0);
  await rt.event('activate');
  assert.equal(rt.stores.has('kang-in-old'),false);assert.equal(rt.stores.has('another-app'),true);assert.equal(rt.claims,1);
  const shell=await rt.event('fetch',{request:{method:'GET',url:origin,mode:'navigate'}});
  assert.match(await shell.text(),/data-app-id="kang-in"/);
});
test('authentication redirects and login HTML cannot replace the offline game',async()=>{
  for(const invalid of [{redirected:true},{async text(){return '<html>Sign in</html>';}}]){
    const rt=runtime(url=>response(url,url===origin,url===origin?invalid:{}));
    await assert.rejects(()=>rt.event('install'),/App shell unavailable/);
    assert.equal(rt.stores.has('kang-in-dev-v3'),false);
  }
});
test('a newer network shell cannot mix with current release assets; updates are explicit',async()=>{
  const rt=runtime();await rt.event('install');const before=rt.calls.length;
  const root=rt.stores.get('kang-in-dev-v3').get(origin);
  const cached=await rt.event('fetch',{request:{method:'GET',url:origin+'?reopen=1',mode:'navigate'}});
  assert.equal(cached,root);assert.equal(rt.calls.length,before);
  await rt.event('message',{data:{type:'SKIP_WAITING'}});assert.equal(rt.skips,1);
  assert.equal(await rt.event('fetch',{request:{method:'GET',url:'https://other.example/auth',mode:'navigate'}}),undefined);
});
