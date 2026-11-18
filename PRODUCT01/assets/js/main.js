(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- 상단 진행바 ---------- */
  const bar = $('.progress');
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')';
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- 등장 모션 ---------- */
  /* ---------- 스크롤 진입 준비 ----------
     · data-split: 단어 단위로 감싸서 마스크 안에서 올라오게
     · .rv: 화면에 들어오기 전까지 비워 두는 대상 */
  const RM0 = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const splitWords = (el) => {
    let wi = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            const w = document.createElement('span'); w.className = 'sw';
            const inner = document.createElement('span'); inner.textContent = t; inner.style.setProperty('--wi', wi++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el); el.classList.add('split-on');
  };
  $$('[data-stagger]').forEach(g => Array.from(g.children).forEach((c, i) => c.style.setProperty('--i', i)));
  const targets = new Set();
  if (!RM0) {
    $$('[data-split]').forEach(el => { splitWords(el); if (el.closest('.sec-head')) el.style.setProperty('--base', '.45s'); targets.add(el); });
    const add = (sel, delay) => $$(sel).forEach((el, k) => {
      if (el.hasAttribute('data-split') || el.closest('.d-hero') || el.closest('.car')) return;
      el.classList.add('rv'); if (delay) el.style.setProperty('--dl', (delay * k).toFixed(2) + 's'); targets.add(el);
    });
    add('.sec-head');
    $$('.cols, .loc, .spec').forEach(g => Array.from(g.children).forEach((c, k) => {
      if (c.hasAttribute('data-split')) return;
      c.classList.add('rv'); c.style.setProperty('--dl', (0.18 * k).toFixed(2) + 's'); targets.add(c);
    }));
    add('.exp'); add('.frame-im');
  }
  $$('[data-stagger]').forEach(g => targets.add(g));
  const revealEls = Array.from(targets);
  if ('IntersectionObserver' in window && !RM0) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); e.target.dispatchEvent(new Event('revealed')); }
    }), { threshold: 0, rootMargin: '0px 0px -16% 0px' });
    revealEls.forEach(el => io.observe(el));
    $$('.reveal').forEach(el => io.observe(el));
  } else { revealEls.forEach(el => el.classList.add('in')); $$('.reveal').forEach(el => el.classList.add('in')); }

  /* ---------- 히어로 캐러셀 ---------- */
  const car = $('[data-carousel]');
  if (car) {
    const slides = $$('.slide', car), dots = $('.dots', car);
    let i = 0, timer;
    slides.forEach((s, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', (k + 1) + '번 이미지: ' + s.querySelector('figcaption').textContent);
      b.addEventListener('click', () => go(k, true));
      dots.appendChild(b);
    });
    const go = (k, user) => {
      i = (k + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle('is-active', n === i));
      $$('button', dots).forEach((d, n) => d.setAttribute('aria-current', n === i ? 'true' : 'false'));
      if (user) restart();
    };
    const restart = () => { clearInterval(timer); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => go(i + 1), 5200); };
    $('.prev', car).addEventListener('click', () => go(i - 1, true));
    $('.next', car).addEventListener('click', () => go(i + 1, true));
    go(0); restart();
  }

  /* ---------- 상세 갤러리 ---------- */
  const gal = $('[data-gallery]');
  if (gal) {
    const main = $('.gallery-main img', gal);
    $$('.thumbs button', gal).forEach(b => b.addEventListener('click', () => {
      $$('.thumbs button', gal).forEach(x => x.setAttribute('aria-current', 'false'));
      b.setAttribute('aria-current', 'true');
      if (main.getAttribute('src') === b.dataset.src) return;
      main.classList.add('swap');
      setTimeout(() => {
        const done = () => { main.classList.remove('swap'); };
        main.onload = done; main.src = b.dataset.src; main.alt = b.dataset.alt;
        if (main.complete) requestAnimationFrame(done);
      }, 320);
    }));
  }

  /* ---------- 3D 뷰어 ---------- */
  const canvas = $('#glb-canvas'), status = $('#viewer-status');
  const showError = (html) => { status.hidden = false; status.classList.add('is-error'); status.innerHTML = '<div>' + html + '</div>'; };
  let viewer = null;
  const VIEWS = {
    iso: [0.62, 1.12, 1], front: [0, Math.PI / 2, 0.92], side: [Math.PI / 2, Math.PI / 2, 0.95],
    back: [Math.PI, Math.PI / 2, 0.95], top: [0.35, 0.42, 0.9]
  };

  try {
    viewer = new GLBViewer(canvas);
  } catch (e) {
    showError('3D 뷰어를 시작할 수 없습니다.<br><small>' + e.message + '</small>');
  }

  if (viewer) {
    const fill = $('.lbar span', status);
    const ready = () => {
      status.hidden = true;
      const start = () => { canvas.classList.add('on'); viewer.intro(); };
      const sec = $('#viewer .exp') || $('#viewer');
      if (sec.classList.contains('in')) setTimeout(start, 350); else sec.addEventListener('revealed', () => setTimeout(start, 450), { once: true });
    };
    /* 내장 모델: 같은 폴더의 product-glb-embed.js 를 불러와 base64 → ArrayBuffer */
    const loadEmbedded = () => new Promise((res, rej) => {
      const done = () => {
        try {
          const bin = atob(window.PRODUCT_GLB_B64), u8 = new Uint8Array(bin.length);
          for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
          window.PRODUCT_GLB_B64 = null;
          viewer.loadBuffer(u8.buffer); res();
        } catch (e) { rej(e); }
      };
      if (window.PRODUCT_GLB_B64) return done();
      const sc = document.createElement('script');
      sc.src = './assets/models/product-glb-embed.js';
      sc.onload = done; sc.onerror = () => rej(new Error('product-glb-embed.js 파일을 찾을 수 없습니다'));
      document.head.appendChild(sc);
    });
    /* 서버·배포 환경: 원본 product.glb → 실패하면 내장본 / 더블클릭(file://): 바로 내장본 */
    const load = true /* 축제 지도 안에서는 내장 모델 사용 */
      ? loadEmbedded()
      : viewer.load('./assets/models/product.glb', p => { fill.style.width = Math.round(p * 100) + '%'; }).catch(loadEmbedded);
    load.then(ready).catch(err => showError('3D 모델을 불러오지 못했습니다.<br><small>' + err.message + '</small>'));

    $$('[data-view]').forEach(b => {
      if (b.classList.contains('part')) return;
      b.addEventListener('click', () => { const v = VIEWS[b.dataset.view]; viewer.view(v[0], v[1], v[2]); });
    });
    const ar = $('#auto-rotate');
    if (viewer.reduced) ar.setAttribute('aria-pressed', 'false');
    ar.addEventListener('click', () => {
      viewer.autoRotate = !viewer.autoRotate;
      ar.setAttribute('aria-pressed', String(viewer.autoRotate));
      if (viewer.autoRotate) viewer.idleTimer = 0;
    });
    $('#reset-view').addEventListener('click', () => { viewer.reset(); $$('.part').forEach(p => p.classList.remove('is-on')); });

    /* 부품 카드 → 하이라이트 */
    $$('.part').forEach(card => card.addEventListener('click', () => {
      const on = !card.classList.contains('is-on');
      $$('.part').forEach(p => p.classList.remove('is-on'));
      if (on) {
        card.classList.add('is-on');
        viewer.highlight(card.dataset.part.split(','));
        const v = VIEWS[card.dataset.view]; viewer.view(v[0], v[1], v[2]);
        canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else viewer.highlight(null);
    }));
  }

  /* ---------- 작동 체험 시뮬레이션 ---------- */
  const S = { unlocked: false, bt: false, radio: false, holding: false };
  const BLUE = [0.3, 0.5, 1.0], RED = [1.0, 0.18, 0.18], OFF = null;
  const btn = { lock: $('#ctl-lock'), bt: $('#ctl-bt'), ptt: $('#ctl-ptt'), radio: $('#ctl-radio') };
  const log = $('#sim-log');
  const say = (title, msg) => { log.innerHTML = '<b class="t">' + title + '</b><span class="t">' + msg + '</span>'; };
  const setBtn = (b, pressed, label) => { b.setAttribute('aria-pressed', String(pressed)); $('.state', b).textContent = label; };
  const focusPart = (names, view) => {
    if (!viewer) return;
    viewer.highlight(names);
    const v = VIEWS[view]; viewer.view(v[0], v[1], v[2]);
    clearTimeout(focusPart.t); focusPart.t = setTimeout(() => viewer.highlight(null), 2200);
  };

  const render = () => {
    setBtn(btn.lock, S.unlocked, S.unlocked ? '해제' : '잠금');
    btn.bt.disabled = !S.unlocked;
    setBtn(btn.bt, S.bt, S.bt ? 'ON' : 'OFF');
    btn.ptt.disabled = !(S.unlocked && S.bt);
    setBtn(btn.ptt, S.holding, S.holding ? '송출 중' : '대기');
    setBtn(btn.radio, S.radio, S.radio ? '연결' : 'OFF');
    if (!viewer) return;
    viewer.setEmissive('status_led_bottom', S.bt ? BLUE : OFF);
    viewer.setEmissive('status_led_top', S.radio ? BLUE : OFF);
  };

  if (viewer) {
    viewer.onFrame(t => {
      if (S.unlocked) {
        const ph = Math.floor(t / 320) % 2;
        viewer.setEmissive('beacon_red', ph ? [0.9, 0.08, 0.08] : [0.25, 0.02, 0.02]);
        viewer.setEmissive('beacon_blue', ph ? [0.04, 0.1, 0.3] : [0.1, 0.3, 1.0]);
      } else {
        viewer.setEmissive('beacon_red', OFF); viewer.setEmissive('beacon_blue', OFF);
      }
    });
  }

  btn.lock.addEventListener('click', () => {
    S.unlocked = !S.unlocked;
    if (!S.unlocked) { S.bt = false; S.holding = false; say('LOCKED', '안전 잠금 상태입니다. 블루투스 제어망과 PTT 버튼이 비활성화되고 경광등이 꺼집니다.'); }
    else say('EMERGENCY MODE', '안전 잠금 해제 — 블루투스 제어망과 PTT 버튼이 활성화되고, 경광등이 비상 상황과 인력 위치를 알립니다. AI 신호기가 위치 신호를 송출합니다.');
    focusPart(['safety_slider', 'slider_mark', 'beacon_red', 'beacon_blue'], 'iso');
    render();
  });
  btn.bt.addEventListener('click', () => {
    S.bt = !S.bt;
    say(S.bt ? 'BLUETOOTH ON' : 'BLUETOOTH OFF', S.bt ? '주변 시민 기기와 내부 기기의 블루투스망을 배지 자체 네트워크로 통합했습니다. 하단 LED가 파란색으로 연결 상태를 표시합니다.' : '블루투스 자체 네트워크를 해제했습니다.');
    focusPart(['bt_button', 'bt_letter', 'status_led_bottom'], 'front');
    render();
  });
  btn.radio.addEventListener('click', () => {
    S.radio = !S.radio;
    say(S.radio ? 'RADIO CONNECTED' : 'RADIO OFF', S.radio ? '내부 통신망(무전망)에 접속했습니다. 다른 기기 사용자와 실시간으로 상황을 공유합니다. 버튼 아래 LED: 파란색(원활).' : '무전망 연결을 종료했습니다.');
    focusPart(['radio_button', 'lens_ring', 'status_led_top'], 'front');
    render();
  });

  /* PTT : 길게 누르기 (마우스·터치·키보드) */
  let pttStart = 0;
  const pttDown = (e) => {
    if (btn.ptt.disabled || S.holding) return;
    if (e && e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    S.holding = true; pttStart = performance.now();
    say('PTT · CAPTURING', 'MCU AI가 주변 소음을 걸러내며 음성을 캡처하고 있습니다… 버튼에서 손을 떼면 송출합니다.');
    if (viewer) { viewer.highlight(['ptt_button']); const v = VIEWS.front; viewer.view(v[0], v[1], v[2]); }
    render();
  };
  const pttUp = (e) => {
    if (!S.holding) return;
    if (e && e.type === 'keyup' && e.key !== ' ' && e.key !== 'Enter') return;
    S.holding = false;
    if (viewer) viewer.highlight(null);
    if (performance.now() - pttStart < 600) say('PTT', '조금 더 길게 눌러 주세요. 누르고 있는 동안 음성이 캡처됩니다.');
    else say('BROADCAST SENT', '캡처한 음성을 재난 안내 문자 형식으로 변환해 블루투스 연결망에 공지를 송출했습니다.');
    render();
  };
  btn.ptt.addEventListener('pointerdown', pttDown);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.ptt.addEventListener(ev, pttUp));
  btn.ptt.addEventListener('keydown', e => { if (!e.repeat) pttDown(e); });
  btn.ptt.addEventListener('keyup', pttUp);
  btn.ptt.addEventListener('contextmenu', e => e.preventDefault());

  render();

  /* =========================================================
     MOTION
  ========================================================= */
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  /* 히어로 진입: 첫 프레임 이후 ready → CSS 지연값이 로더 퇴장 시점에 맞춰 이어짐 */
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));
  const loader = $('#loader');
  if (loader) loader.addEventListener('animationend', e => { if (e.animationName === 'ldout') loader.remove(); });

  /* 숫자 카운트업 (제품 상세 크기) */
  const counts = $$('[data-count]');
  const runCount = () => counts.forEach(el => {
    const to = +el.dataset.count, t0 = performance.now(), dur = 1400;
    const tick = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  const tb = counts.length && counts[0].closest('[data-stagger]');
  if (tb && !RM) { counts.forEach(el => el.textContent = '0'); tb.addEventListener('revealed', () => setTimeout(runCount, 350), { once: true }); }

  /* 큰 외곽선 번호 · 히어로 이미지: 아주 약한 패럴랙스 */
  const bigno = $('.bigno'), heroImgWrap = $('.car .frame');
  if (!RM) {
    let ticking = false;
    const par = () => {
      const y = scrollY;
      if (bigno) bigno.style.transform = 'translate3d(0,' + (y * -0.12).toFixed(1) + 'px,0)';
      if (heroImgWrap && y < innerHeight * 1.4) $$('.slide img', heroImgWrap).forEach(im => im.style.translate = '0 ' + (y * 0.06).toFixed(1) + 'px');
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(par); } }, { passive: true });
  }

  const fine = matchMedia('(pointer: fine)').matches;
  /* 마그네틱 버튼: 포인터 쪽으로 살짝 끌려옴 */
  if (fine && !RM) {
    $$('[data-mag]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* 커서: 점은 즉시, 링은 부드럽게 따라옴. 3D 캔버스 위에서는 DRAG */
  if (fine && !RM) {
    const cur = $('#cur'), ring = $('#ring');
    let mx = -100, my = -100, rx = -100, ry = -100;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; cur.style.transform = 'translate(' + mx + 'px,' + my + 'px)'; }, { passive: true });
    const loop = () => { rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16; ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)'; requestAnimationFrame(loop); };
    loop();
    const HOV = 'a,button,[data-mag],.thumbs button';
    document.addEventListener('pointerover', e => {
      const t = e.target;
      document.body.classList.toggle('drag', !!t.closest('#glb-canvas'));
      document.body.classList.toggle('hov', !!t.closest(HOV) && !t.closest('#glb-canvas'));
    });
    addEventListener('pointerdown', () => document.body.classList.add('down'));
    addEventListener('pointerup', () => document.body.classList.remove('down'));
    document.addEventListener('pointerleave', () => { cur.style.opacity = ring.style.opacity = 0; });
    document.addEventListener('pointerenter', () => { cur.style.opacity = ring.style.opacity = ''; });
  }

  /* 페이지 이동 전환: 다른 페이지로 가는 링크만 */
  const pt = $('#pt');
  if (pt && !RM) {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      e.preventDefault();
      pt.classList.add('go');
      setTimeout(() => { location.href = a.href; }, 620);
    });
    addEventListener('pageshow', () => pt.classList.remove('go'));
  }
})();
