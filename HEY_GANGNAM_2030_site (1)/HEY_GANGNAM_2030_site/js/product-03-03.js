(function(){const box=document.getElementById('hero3d'),tb=box.querySelector('.vtools'),V=()=>window.__m3d;
      const spinBtn=tb.querySelector('[data-t=spin]');
      tb.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!V())return;const t=b.dataset.t,v=V();
        if(t==='spin'){const on=v.spin(!v.isSpin());spinBtn.setAttribute('aria-pressed',on);spinBtn.classList.toggle('on',on)}
        else if(t==='in')v.zoom(.8);else if(t==='out')v.zoom(1.25);
        else if(t==='reset'){v.spin(false);spinBtn.setAttribute('aria-pressed',false);spinBtn.classList.remove('on');v.view('persp');box.querySelectorAll('[data-v]').forEach(x=>x.classList.toggle('on',x.dataset.v==='persp'))}
        else if(t==='full'){if(document.fullscreenElement)document.exitFullscreen();else if(box.requestFullscreen)box.requestFullscreen();else if(box.webkitRequestFullscreen)box.webkitRequestFullscreen()}});
      document.addEventListener('fullscreenchange',()=>{const f=document.fullscreenElement===box;tb.querySelector('[data-t=full] span').textContent=f?'나가기':'전체 화면';setTimeout(()=>V()&&V().kick(),50)});
    })();
