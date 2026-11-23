(() => {
  const frame=document.querySelector('.laptop-collection');
  if(!frame)return;
  window.addEventListener('message',event=>{
    if(event.source===frame.contentWindow && event.data?.type==='weby-hero-ready')
      frame.classList.add('is-ready');
  });
  let visible=true;
  const send=()=>frame.contentWindow?.postMessage({type:'weby-hero-visibility',visible:visible&&!document.hidden},'*');
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;send();}).observe(frame);
  frame.addEventListener('load',send);
  document.addEventListener('visibilitychange',send);
})();
