(function(){const v=document.getElementById('heroFilm'),b=document.getElementById('filmBtn'),PAUSE='<rect x="2" y="1.5" width="2.6" height="9" rx=".6"/><rect x="7.4" y="1.5" width="2.6" height="9" rx=".6"/>',PLAY='<path d="M3 1.5v9l7.5-4.5z"/>';
    const ui=()=>{const p=v.paused;b.querySelector('svg').innerHTML=p?PLAY:PAUSE;b.querySelector('span').textContent=p?'재생':'일시 정지';b.setAttribute('aria-label',p?'영상 재생':'영상 일시 정지')};
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){v.removeAttribute('autoplay');v.pause()}
    b.onclick=()=>{v.paused?v.play():v.pause()};v.addEventListener('play',ui);v.addEventListener('pause',ui);
    if('IntersectionObserver' in window)new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting&&!v.paused){v.pause();v.dataset.auto=1}else if(e.isIntersecting&&v.dataset.auto){delete v.dataset.auto;v.play().catch(()=>{})}})).observe(v);
    ui();})();
