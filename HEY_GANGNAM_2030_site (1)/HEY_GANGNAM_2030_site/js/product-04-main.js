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

  /* ---------- 상세 갤러리: 슬라이더 (화살표 · 썸네일 · 드래그/스와이프 · 키보드) ---------- */
  const gal = $('[data-gallery]');
  if (gal) {
    const box = $('.gallery-main', gal), thumbs = $$('.thumbs button', gal);
    box.innerHTML = '<div class="gs-track">' + thumbs.map((b, k) =>
      `<figure class="gs-slide${k ? '' : ' on'}"><img src="${b.dataset.src}" alt="${b.dataset.alt}" draggable="false"${k ? ' loading="lazy"' : ''}></figure>`).join('') + '</div>' +
      '<button type="button" class="gs-arrow gs-prev" aria-label="이전 사진"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>' +
      '<button type="button" class="gs-arrow gs-next" aria-label="다음 사진"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>' +
      `<span class="gs-count" aria-live="polite"><b>01</b> / ${String(thumbs.length).padStart(2, '0')}</span>` +
      '<span class="gs-cap"></span>';
    box.setAttribute('tabindex', '0'); box.setAttribute('aria-roledescription', 'carousel'); box.setAttribute('aria-label', '제품 이미지');
    const track = $('.gs-track', box), slides = $$('.gs-slide', box), cnt = $('.gs-count b', box), cap = $('.gs-cap', box);
    let gi = 0, drag = null;
    const gGo = (k, dir) => {
      gi = (k + slides.length) % slides.length;
      track.style.transform = `translate3d(${-gi * 100}%,0,0)`;
      slides.forEach((sl, n) => sl.classList.toggle('on', n === gi));
      thumbs.forEach((t, n) => t.setAttribute('aria-current', String(n === gi)));
      cnt.textContent = String(gi + 1).padStart(2, '0'); cnt.classList.remove('roll'); void cnt.offsetWidth; cnt.classList.add('roll');
      cap.textContent = thumbs.at(gi).dataset.alt; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in');
    };
    $('.gs-prev', box).addEventListener('click', () => gGo(gi - 1));
    $('.gs-next', box).addEventListener('click', () => gGo(gi + 1));
    thumbs.forEach((t, k) => t.addEventListener('click', () => gGo(k)));
    box.addEventListener('keydown', e => { if (e.key === 'ArrowRight') gGo(gi + 1); if (e.key === 'ArrowLeft') gGo(gi - 1); });
    box.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      drag = { x: e.clientX, w: box.clientWidth, dx: 0 }; box.setPointerCapture(e.pointerId); track.classList.add('dragging');
    });
    box.addEventListener('pointermove', e => {
      if (!drag) return;
      drag.dx = e.clientX - drag.x;
      track.style.transform = `translate3d(calc(${-gi * 100}% + ${drag.dx}px),0,0)`;
    });
    const end = () => {
      if (!drag) return;
      track.classList.remove('dragging');
      const th = drag.w * 0.18;
      if (drag.dx < -th) gGo(gi + 1); else if (drag.dx > th) gGo(gi - 1); else gGo(gi);
      drag = null;
    };
    box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
    gGo(0);
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
      sc.src = 'assets/models/p04-badge-glb-embed.js';
      sc.onload = done; sc.onerror = () => rej(new Error('product-glb-embed.js 파일을 찾을 수 없습니다'));
      document.head.appendChild(sc);
    });
    /* 서버·배포 환경: 원본 product.glb → 실패하면 내장본 / 더블클릭(file://): 바로 내장본 */
    const load = location.protocol === 'file:'
      ? loadEmbedded()
      : viewer.load('assets/models/p04-badge.glb', p => { fill.style.width = Math.round(p * 100) + '%'; }).catch(loadEmbedded);
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
    focusPart(['safety_slider', 'beacon_red', 'beacon_blue'], 'iso');
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
    if (viewer) { viewer.highlight(['ptt_button', 'ptt_icon']); const v = VIEWS.front; viewer.view(v[0], v[1], v[2]); }
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
      setTimeout(() => { location.href = a.href; }, 400);
    });
    addEventListener('pageshow', () => pt.classList.remove('go'));
  }

  /* =========================================================
     HERO SCENE — 스크롤 진행도(0~1)에 따라 단계 전환
     0.035↑ 제품 튀어오름 · 0.14↑ 소개 문구 · 0.26↑ 부위 표시
     맨 위로 돌아가면 제품이 다시 내려가고, 내려오면 다시 튀어오름
  ========================================================= */
  const hs = $('.hs');
  if (hs) {
    if (RM) { hs.classList.add('is-pop', 'is-copy', 'is-call'); }
    else {
      let popped = false, raf = 0;
      const upd = () => {
        raf = 0;
        const r = hs.getBoundingClientRect();
        const top = ($('.hdr') ? $('.hdr').offsetHeight : 0) + ($('.bar') ? $('.bar').offsetHeight : 0);
        const run = hs.offsetHeight - (innerHeight - top);
        const p = Math.min(1, Math.max(0, (top - r.top) / Math.max(1, run)));
        hs.style.setProperty('--p', p.toFixed(4));
        hs.style.setProperty('--p2', Math.max(0, (p - 0.3) / 0.7).toFixed(4));
        hs.style.setProperty('--px', Math.max(0, (p - 0.8) / 0.2).toFixed(4));
        const on = p > 0.035;
        if (on && !popped) { popped = true; hs.classList.remove('is-sink'); hs.classList.add('is-pop'); }
        else if (!on && popped && p < 0.01) { popped = false; hs.classList.remove('is-pop', 'is-copy', 'is-call'); hs.classList.add('is-sink'); }
        hs.classList.toggle('is-copy', popped && p > 0.14);
        hs.classList.toggle('is-call', popped && p > 0.26);
      };
      const req = () => { if (!raf) raf = requestAnimationFrame(upd); };
      addEventListener('scroll', req, { passive: true });
      addEventListener('resize', req);
      upd();
    }
  }

  /* =========================================================
     개선안: 02 탭(작동 체험 / 부품 살펴보기) · 부품 펼치기
             · 히어로 부위 표시 → 해당 부품 · 섹션 위치 표시 · 맨 위로
  ========================================================= */
  const tabs = $$('.ctabs [role="tab"]');
  const selectTab = (id, focus) => {
    tabs.forEach(t => {
      const on = t.id === id;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      const pane = document.getElementById(t.getAttribute('aria-controls'));
      if (on && pane.hidden) { pane.hidden = false; pane.classList.remove('swap-in'); void pane.offsetWidth; pane.classList.add('swap-in'); }
      else if (!on) pane.hidden = true;
      if (on && focus) t.focus();
    });
    if (id === 'tab-try' && viewer) { viewer.highlight(null); $$('.plist2 .part').forEach(b => b.setAttribute('aria-expanded', 'false')); }
  };
  tabs.forEach((t, k) => {
    t.addEventListener('click', () => selectTab(t.id));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const n = tabs.at((k + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length);
      selectTab(n.id, true);
    });
  });

  const partBtns = $$('.plist2 .part');
  const openPart = (btn) => {
    const willOpen = btn.getAttribute('aria-expanded') !== 'true';
    partBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (!viewer) { if (willOpen) btn.setAttribute('aria-expanded', 'true'); return; }
    if (willOpen) {
      btn.setAttribute('aria-expanded', 'true');
      viewer.highlight(btn.dataset.part.split(','));
      const v = VIEWS[btn.dataset.view]; viewer.view(v[0], v[1], v[2]);
    } else viewer.highlight(null);
  };
  partBtns.forEach(b => b.addEventListener('click', () => openPart(b)));
  const rv = $('#reset-view');
  if (rv) rv.addEventListener('click', () => partBtns.forEach(b => b.setAttribute('aria-expanded', 'false')));

  /* 히어로 부위 표시를 누르면 02의 해당 부품으로 */
  $$('.callouts .co').forEach(co => co.addEventListener('click', () => {
    const btn = partBtns.at(+co.dataset.go);
    if (!btn) return;
    selectTab('tab-parts');
    const exp = $('#viewer .exp');
    if (exp) { exp.classList.add('in'); exp.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: innerWidth > 900 ? 'center' : 'start' }); }
    setTimeout(() => { if (btn.getAttribute('aria-expanded') !== 'true') openPart(btn); }, RM ? 0 : 650);
  }));

  /* 섹션 위치 표시 · 맨 위로 */
  const snav = $('.snav'), totop = $('.totop');
  const secs = $$('.snav a').map(a => ({ a, el: document.getElementById(a.dataset.sec) })).filter(o => o.el);
  let navRaf = 0;
  const navUpd = () => {
    navRaf = 0;
    const heroEl = $('#hero');
    const pastHero = heroEl ? heroEl.getBoundingClientRect().bottom < innerHeight * 0.6 : scrollY > innerHeight;
    if (snav) snav.classList.toggle('show', pastHero);
    if (totop) totop.classList.toggle('show', scrollY > innerHeight * 1.2);
    const line = innerHeight * 0.4;
    let cur = null;
    secs.forEach(o => { if (o.el.getBoundingClientRect().top <= line) cur = o; });
    secs.forEach(o => { const on = o === cur; o.a.classList.toggle('on', on); if (on) o.a.setAttribute('aria-current', 'true'); else o.a.removeAttribute('aria-current'); });
  };
  addEventListener('scroll', () => { if (!navRaf) navRaf = requestAnimationFrame(navUpd); }, { passive: true });
  addEventListener('resize', () => { if (!navRaf) navRaf = requestAnimationFrame(navUpd); });
  navUpd();

  /* =========================================================
     MOTION LAYER 2 — 스크롤 진행도 기반 연출
     · [data-scrub] : --sp(지나가는 진행도) · --en(들어오는 진행도)
     · [data-fill]  : 읽는 위치만큼 단어가 채워짐
     · .hx          : 시나리오 가로 스크롤 장면 (넓은 화면)
     · .plist .pt   : 마우스 방향으로 기울어지는 카드
  ========================================================= */
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const scrubs = $$('[data-scrub]');
  const fills = $$('[data-fill]').map(el => { el.classList.add('fill-on'); return { el, words: $$('.sw>span', el) }; });
  const hx = $('.hx'), hxPin = hx && $('.hx-pin', hx), hxTrack = hx && $('.hx-track', hx), hxSteps = hx ? $$('.step', hx) : [], hxCount = hx && $('.hx-count b', hx);
  let hxTravel = 0, hxWide = false;
  const hxLayout = () => {
    if (!hx) return;
    hxWide = innerWidth >= 1081 && !RM;
    hx.classList.toggle('hx-on', hxWide);
    if (!hxWide) { hx.style.removeProperty('--hx-h'); hx.style.removeProperty('--hx'); return; }
    hxTravel = Math.max(0, hxTrack.scrollWidth - innerWidth);
    const pad = parseFloat(getComputedStyle(hx).paddingTop) || 0;
    hx.style.setProperty('--hx-h', (pad + hxPin.offsetHeight + hxTravel + innerHeight * 0.15) + 'px');
  };
  let lastAct = -1, mRaf = 0;
  const motion = () => {
    mRaf = 0;
    const vh = innerHeight;
    scrubs.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      el.style.setProperty('--sp', clamp01((vh - r.top) / (vh + r.height)).toFixed(4));
      el.style.setProperty('--en', clamp01((vh - r.top) / (vh * 0.7)).toFixed(4));
    });
    fills.forEach(f => {
      const r = f.el.getBoundingClientRect();
      const p = clamp01((vh * 0.88 - r.top) / (r.height + vh * 0.32));
      const lit = Math.round(p * f.words.length);
      f.words.forEach((w, k) => w.classList.toggle('lit', k < lit));
    });
    if (hx && hxWide) {
      const r = hx.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(hx).paddingTop) || 0;
      const stick = ($('.hdr') ? $('.hdr').offsetHeight : 0) + ($('.bar') ? $('.bar').offsetHeight : 0);
      const p = hxTravel ? clamp01((stick - (r.top + pad)) / hxTravel) : 0;
      hx.style.setProperty('--hx', (p * hxTravel).toFixed(1));
      hx.style.setProperty('--hp', p.toFixed(4));
      const act = Math.min(hxSteps.length - 1, Math.round(p * (hxSteps.length - 1)));
      if (act !== lastAct) { lastAct = act; hxSteps.forEach((st, k) => st.classList.toggle('act', k === act)); if (hxCount) rollCount(hxCount, String(act + 1).padStart(2, '0')); }
    }
  };
  const reqMotion = () => { if (!mRaf) mRaf = requestAnimationFrame(motion); };
  if (RM) { fills.forEach(f => f.words.forEach(w => w.classList.add('lit'))); }
  addEventListener('scroll', reqMotion, { passive: true });
  addEventListener('resize', () => { hxLayout(); reqMotion(); });
  addEventListener('load', () => { hxLayout(); reqMotion(); });
  hxLayout(); motion();

  /* 포인트 카드: 마우스 방향으로 살짝 기울어짐 */
  if (fine && !RM) {
    $$('.plist .pt').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(700px) rotateY(${(x * 8).toFixed(2)}deg) rotateX(${(-y * 8).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* =========================================================
     시나리오 영상: 누르지 않아도 자동 반복 재생
     (소리 없음 · 화면에 보일 때 재생, 벗어나면 잠시 멈춰 성능 유지)
  ========================================================= */
  const vids = $$('video.sv');
  const tryPlay = v => { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); };
  vids.forEach(v => {
    v.muted = true; v.defaultMuted = true; v.playsInline = true;
    v.addEventListener('playing', () => v.parentElement.classList.add('playing'));
    v.addEventListener('pause', () => v.parentElement.classList.remove('playing'));
  });
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) tryPlay(e.target); else e.target.pause(); }), { rootMargin: '200px 400px' });
    vids.forEach(v => { v.preload = 'auto'; vio.observe(v); });
  } else vids.forEach(tryPlay);
  /* 자동 재생이 막힌 브라우저: 첫 터치·클릭·스크롤 때 다시 시도 */
  const kick = () => { vids.forEach(v => { if (v.paused) { const r = v.getBoundingClientRect(); if (r.bottom > -200 && r.top < innerHeight + 200) tryPlay(v); } }); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, kick, { once: true, passive: true }));

  /* =========================================================
     시나리오 넘기기 버튼
     · 넓은 화면(가로 스크롤 장면): 해당 장면 위치로 페이지를 부드럽게 스크롤
     · 좁은 화면: 카드 줄을 옆으로 넘김 (손가락으로 밀어도 됨)
  ========================================================= */
  if (hx) {
    const prevB = $('.hx-prev', hx), nextB = $('.hx-next', hx), track = hxTrack, N = hxSteps.length;
    const stickH = () => ($('.hdr') ? $('.hdr').offsetHeight : 0) + ($('.bar') ? $('.bar').offsetHeight : 0);
    let curIdx = 0;
    const setUI = (k, p) => {
      curIdx = k;
      prevB.disabled = k <= 0; nextB.disabled = k >= N - 1;
      if (!hxWide) {
        hxSteps.forEach((st, j) => st.classList.toggle('act', j === k));
        if (hxCount) rollCount(hxCount, String(k + 1).padStart(2, '0'));
        hx.style.setProperty('--hp', p.toFixed(4));
      }
    };
    const goStep = k => {
      k = Math.max(0, Math.min(N - 1, k));
      if (hxWide) {
        const pad = parseFloat(getComputedStyle(hx).paddingTop) || 0;
        const top = hx.getBoundingClientRect().top + scrollY + pad - stickH();
        scrollTo({ top: top + hxTravel * k / (N - 1) + 2, behavior: RM ? 'auto' : 'smooth' });
      } else {
        const st = hxSteps.at(k), padL = parseFloat(getComputedStyle(track).paddingLeft) || 0;
        const max = track.scrollWidth - track.clientWidth;
        track.scrollTo({ left: Math.min(max, st.offsetLeft - padL), behavior: RM ? 'auto' : 'smooth' });
        if (st.offsetLeft - padL >= max - 4) setTimeout(() => setUI(k, 1), RM ? 0 : 450);
      }
    };
    prevB.addEventListener('click', () => goStep(curIdx - 1));
    nextB.addEventListener('click', () => goStep(curIdx + 1));
    /* 현재 장면 추적 */
    const trackIdx = () => {
      if (hxWide) {
        const p = parseFloat(hx.style.getPropertyValue('--hp')) || 0;
        setUI(Math.min(N - 1, Math.round(p * (N - 1))), p);
      } else {
        const max = Math.max(1, track.scrollWidth - track.clientWidth), p = track.scrollLeft / max;
        const padL = parseFloat(getComputedStyle(track).paddingLeft) || 0;
        let k = 0, best = Infinity;
        hxSteps.forEach((st, j) => { const d = Math.abs(st.offsetLeft - padL - track.scrollLeft); if (d < best) { best = d; k = j; } });
        if (track.scrollLeft >= max - 4) k = Math.max(k, N - 1);
        setUI(k, p);
      }
    };
    addEventListener('scroll', () => requestAnimationFrame(trackIdx), { passive: true });
    track.addEventListener('scroll', () => requestAnimationFrame(trackIdx), { passive: true });
    addEventListener('resize', () => requestAnimationFrame(trackIdx));
    /* 키보드: 버튼에 초점이 있을 때 ← → */
    [prevB, nextB].forEach(b => b.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goStep(curIdx + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goStep(curIdx - 1); }
    }));
    trackIdx();
  }

  /* =========================================================
     인터페이스 슬라이딩: 숫자 굴림 · 탭 밑줄 · 방향 있는 패널 전환 · 섹션 레일
  ========================================================= */
  function rollCount(el, t) {
    if (el.textContent === t) return;
    el.textContent = t; el.classList.remove('roll'); void el.offsetWidth; el.classList.add('roll');
  }
  /* 02 탭: 미끄러지는 밑줄 + 탭 순서에 따른 패널 슬라이드 방향 */
  const ctabs = $('.ctabs');
  if (ctabs) {
    const ind = document.createElement('span'); ind.className = 'ctab-ind'; ind.setAttribute('aria-hidden', 'true'); ctabs.appendChild(ind);
    const place = () => { const t = $('[role="tab"][aria-selected="true"]', ctabs); if (!t) return; ind.style.transform = `translateX(${t.offsetLeft}px)`; ind.style.width = t.offsetWidth + 'px'; };
    let prevIdx = 0;
    const tabList = $$('[role="tab"]', ctabs);
    new MutationObserver(() => {
      const idx = tabList.findIndex(t => t.getAttribute('aria-selected') === 'true');
      const pane = document.getElementById(tabList.at(idx).getAttribute('aria-controls'));
      if (idx !== prevIdx && pane) { pane.classList.remove('from-l', 'from-r'); void pane.offsetWidth; pane.classList.add(idx > prevIdx ? 'from-r' : 'from-l'); }
      prevIdx = idx; place();
    }).observe(ctabs, { attributes: true, subtree: true, attributeFilter: ['aria-selected'] });
    addEventListener('resize', place); place();
    ctabs.classList.add('has-ind');
  }
  /* 섹션 레일: 페이지 진행도 */
  const snavEl = $('.snav');
  if (snavEl) {
    const rail = () => { const h = document.documentElement; snavEl.style.setProperty('--np', (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)).toFixed(4)); };
    addEventListener('scroll', rail, { passive: true }); rail();
  }
})();
