(() => {
const modes = [
  {name:'차단 모드', text:'나란히 배치한 가림막 6대가 관람 구역과 통로를 나눕니다.', next:'체험 시작'},
  {name:'개방 모드 · 90°', text:'가림막 6대의 상단과 양쪽 패널이 동시에 90° 회전해 통로를 엽니다.', next:'차단 모드로 복귀'},
  {name:'차단 모드 복귀', text:'회전부가 원래 방향으로 돌아가 다음 공연을 준비합니다.', next:'다시 체험'}
];
const stage = document.querySelector('#stage');
const advance = document.querySelector('#advance');
const modeLabel = document.querySelector('#mode');
const status = document.querySelector('#simulation-status');
let step = 0;
function showStep(nextStep) {
  step = nextStep;
  const mode = modes[step];
  stage.dataset.open = String(step === 1);
  modeLabel.textContent = mode.name;
  status.textContent = mode.text;
  advance.textContent = mode.next;
}
advance.addEventListener('click', () => showStep(step === 1 ? 2 : 1));
document.querySelector('#reset').addEventListener('click', () => showStep(0));
})();
