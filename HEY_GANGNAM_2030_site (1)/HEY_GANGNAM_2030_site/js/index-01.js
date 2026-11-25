
var SU=1.4;   /* 한 구간 = 화면 높이의 140% — 한 번에 훅 넘어가지 않게 */setTimeout(function(){document.documentElement.classList.add('gl-ready')},5000);   /* 안전장치: 5초 뒤에는 로더를 무조건 걷음 */   /* 스크롤 1구간 = 화면 높이의 100% — 민감도를 낮춰 한 번에 덜 넘어감 */
/* 모션 안전장치: 스크립트가 정상 초기화된 경우에만 .js 상태(등장 전 숨김·커스텀 커서)를 유지 */
(function(d){if(matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches)d.documentElement.classList.add('rm')})(document);
