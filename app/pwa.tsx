'use client';
import { useEffect, useState } from 'react';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome:'accepted'|'dismissed'}>;
}

export function AppTools({onGuide}:{onGuide:()=>void}) {
  const [install,setInstall]=useState<InstallPrompt|null>(null);
  const [installed,setInstalled]=useState(false);
  const [offline,setOffline]=useState(false);
  const [prepared,setPrepared]=useState(false);
  const [update,setUpdate]=useState<ServiceWorker|null>(null);
  const [message,setMessage]=useState('');
  useEffect(()=>{
    // The downloadable single HTML also works, without requiring a web server.
    if(location.protocol==='file:')return;
    const display=window.matchMedia('(display-mode: standalone)');
    const sync=()=>{setInstalled(display.matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone));setOffline(!navigator.onLine);};
    const capture=(event:Event)=>{event.preventDefault();setInstall(event as InstallPrompt);};
    const done=()=>{setInstall(null);setInstalled(true);};
    let alive=true;
    const watchWorker=(worker:ServiceWorker|null)=>{
      if(!worker)return;
      const state=()=>{
        if(!alive)return;
        if(worker.state==='installed'&&navigator.serviceWorker.controller)setUpdate(worker);
        if(worker.state==='redundant'&&!navigator.serviceWorker.controller)setMessage('오프라인 준비를 마치지 못했어요. 연결된 상태로 플레이해 주세요.');
      };
      worker.addEventListener('statechange',state);
      state();
    };
    const watch=(reg:ServiceWorkerRegistration)=>{
      if(reg.waiting)setUpdate(reg.waiting);
      watchWorker(reg.installing);
      reg.addEventListener('updatefound',()=>watchWorker(reg.installing));
    };
    sync();
    window.addEventListener('online',sync);window.addEventListener('offline',sync);
    window.addEventListener('beforeinstallprompt',capture);window.addEventListener('appinstalled',done);
    display.addEventListener('change',sync);
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{if(alive)watch(reg);}).catch(()=>{if(alive)setMessage('오프라인 준비가 안 됐어요. 연결된 상태로 플레이해 주세요.');});
      navigator.serviceWorker.ready.then(()=>{if(alive)setPrepared(true);});
    }
    return()=>{alive=false;window.removeEventListener('online',sync);window.removeEventListener('offline',sync);window.removeEventListener('beforeinstallprompt',capture);window.removeEventListener('appinstalled',done);display.removeEventListener('change',sync);};
  },[]);
  const installApp=async()=>{
    if(!install){onGuide();return;}
    try{await install.prompt();const result=await install.userChoice;setInstall(null);if(result.outcome==='accepted')setMessage('설치 후 홈 화면에서 실행해 주세요.');}catch{onGuide();}
  };
  const applyUpdate=()=>{
    if(!update)return;
    navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});
    update.postMessage({type:'SKIP_WAITING'});
  };
  return <div className="app-tools"><span>{offline?'오프라인 플레이':prepared?'오프라인 준비 완료':'기기 내 자동 저장'}</span>{update?<button onClick={applyUpdate}>새 버전 적용</button>:!installed&&<button onClick={()=>void installApp()}>앱 설치</button>}{message&&<p role="status">{message}</p>}</div>;
}
