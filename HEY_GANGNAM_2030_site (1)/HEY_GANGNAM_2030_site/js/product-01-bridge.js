
/* 공통 브리지 — 축제 지도(상위 페이지) 안에서 열렸을 때: 자체 상단 메뉴는 숨기고(공통 상단 바 사용), 바깥 링크·Esc 는 축제 지도로, 다른 제품 링크는 해당 제품으로 */
(function(){if(window.parent===window)return;var d=document.documentElement;d.classList.add('hg-embed');
var st=document.createElement('style');st.textContent='.hg-embed body>header,.hg-embed .hdr,.hg-embed body>.bar,.hg-embed .hdr+.bar{display:none!important}.hg-embed,.hg-embed body{scroll-padding-top:0!important}';(document.head||d).appendChild(st);
function go(m){try{parent.postMessage(Object.assign({hg:1},m),'*')}catch(e){}}
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href')||'';
  var m=/product-0(\d)\.html/.exec(h),M={1:1,2:3,3:2,4:0};if(m&&M[m[1]]!=null){e.preventDefault();e.stopImmediatePropagation();go({open:M[m[1]]});return}m=/PRODUCT0(\d)/.exec(h);if(m){e.preventDefault();e.stopImmediatePropagation();go({open:+m[1]-1});return}
  if(h==='index.html'||/^\.\.\//.test(h)){e.preventDefault();e.stopImmediatePropagation();go({close:1})}},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape')go({close:1})});
addEventListener('message',function(e){var m=e.data;if(!m||!m.hg||!m.go)return;if(m.go==='#top'){scrollTo({top:0,behavior:'smooth'});return}var t=document.querySelector(m.go);if(t)t.scrollIntoView({behavior:'smooth',block:'start'})});})();
