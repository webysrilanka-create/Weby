(() => {
  const frame=document.querySelector('.laptop-collection');
  if(!frame)return;
  let visible=true;
  const send=()=>frame.contentWindow?.postMessage({type:'weby-hero-visibility',visible:visible&&!document.hidden},'*');
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;send();}).observe(frame);
  frame.addEventListener('load',send);
  document.addEventListener('visibilitychange',send);
})();
