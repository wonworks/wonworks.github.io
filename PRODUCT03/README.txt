Echo Ring · 개인 제품 페이지 (2030 HEY GANGNAM · TEAM 01 · 제품 03 · 홍재원)
=============================================================================

실행
  index.html 을 브라우저(Edge·Chrome)로 엽니다. 인터넷 없이도 작동합니다.
  (글꼴은 팀 공통 글꼴 ../assets/fonts 를 사용 — 인터넷 없이 표시)

폴더 구조 (2030 FUTURE WORLD 웹사이트 제작 가이드 기준)
  PRODUCT03/
  ├── index.html                    개인 제품 페이지
  ├── README.txt                    이 문서
  ├── css/
  │   └── style.css                 페이지 스타일
  ├── js/
  │   ├── config.js                 ★ GitHub 주소 · GLB 경로 설정 (여기만 고치면 됨)
  │   ├── glb-viewer.js             GLB 3D 뷰어 (외부 라이브러리 없이 WebGL2)
  │   ├── model-data.js             echo_ring.glb 사본 (파일을 더블클릭해 열어도 3D가 보이도록)
  │   └── main.js                   모션 · 3D 모델 · 스토리텔링 · 사용 장면 3D
  └── assets/
      ├── images/                   [빨간색 · 이미지]
      │   ├── render-*.jpg             AI 렌더 4뷰 (사선 · 평면 · 정면 · 측면) — 페이지 '렌더 이미지'
      │   ├── scene-01~05.jpg          시나리오 5컷 — 페이지 03 사용 안내
      │   ├── product-views/           영상용 제품 뷰 (3D 모델 렌더, 1920×1080 JPG)
      │   ├── scenario/                영상용 시나리오 전체컷 5장 (1280×720 PNG)
      │   └── interaction/             인터랙션 명세용 GIF 3개
      ├── models/                   [파란색 · 3D 모델]
      │   └── echo_ring.glb            Echo Ring 3D 모델 (상판 60 × 24 mm, 단위 m)
      ├── videos/                   [노란색 · 영상]
      │   ├── product-turntable.mp4    제품 360° 회전 (5초, 1920×1080)
      │   └── scenario-loop.mp4        사용 시나리오 12초 루프 (1280×720)
      └── content/                  [초록색 · 텍스트·데이터]
          └── echo-ring.json           페이지 문구 · 사양 · 시나리오 · 치수 데이터

GitHub 주소 넣기
  js/config.js 의 GITHUB_URL = '' 따옴표 안에 주소를 넣으면
  헤더와 푸터에 GitHub 링크가 나타납니다. 비어 있으면 링크를 숨깁니다.

팀 사이트 연결
  팀 index.html 에서 SITES={0:'PRODUCT01/index.html'} 를
  SITES={0:'PRODUCT01/index.html',2:'PRODUCT03/index.html'} 로 바꾸면
  [제품 자세히 보기] 에서 이 페이지가 열립니다.
  이 페이지의 '2030 HEY GANGNAM' 링크와 이전 · 다음 제품 버튼은 ../index.html 로 갑니다.

페이지 구성
  히어로          제품명 · 한 줄 소개 · 3D 모델 / 렌더 이미지 전환
  01 제품 개요     핵심 문장 · 특징 3가지 (방향을 손끝으로 · 손은 그대로 · 판단은 사람이)
  02 제품 체험     사용 장면 3D 재생 · 손동작 3가지 (느끼기 · 쓸기 · 오므리기)
  03 사용 안내     스토리텔링: 왼쪽 거리 분석 패널 + 오른쪽 시간 타임라인 5단계, 기대 효과
  04 제품 상세     3면 도면(치수) · 디자인 언어 · 전체 사양(펼쳐 보기)

인터랙티브 요소 [보라색 · 별도 기능 명세]
  INTERACTION-01 / (GitHub 주소)#pa-s3 — 스크롤에 따라 분석 패널이 바뀌는 스토리텔링
                 타임라인을 스크롤하면 왼쪽 지도에서 A·B 위치, 거리(m), 혼잡도, 상태가
                 연결 유지 → 떨어짐 감지 → 방향 안내 → 부르는 중 → 재회 순으로 바뀜
                 GIF: assets/images/interaction/interaction-01-scroll-story.gif
  INTERACTION-02 / (GitHub 주소)#top — 마우스 움직임에 반응하는 3D 오브젝트
                 드래그 · 방향키로 회전, 휠 · 핀치로 확대 (GLB 모델 실시간 렌더)
                 GIF: assets/images/interaction/interaction-02-mouse-3d.gif
  INTERACTION-03 / (GitHub 주소)#top — 버튼 클릭으로 시점 · 보기 방식이 전환되는 방식
                 사선 · 평면 · 정면 · 측면 시점 버튼, 3D 모델 ↔ 렌더 이미지 전환,
                 02 체험의 장면 번호 1~5 · 재생 · 처음으로 버튼
                 GIF: assets/images/interaction/interaction-03-buttons.gif
  ※ (GitHub 주소) 는 개인 GitHub Pages 주소가 정해지면 바꿔 적습니다.

참고
  · 상판 60 × 24 mm 외의 치수(두께 3.4 · 높이 19.9 · 링 폭 22 · 밴드 폭 7.8 mm)는
    렌더 비율에서 잰 추정값입니다. 실제 치수가 정해지면 모델과 도면을 함께 고칩니다.
  · 03 사용 안내의 시나리오 사진 ④⑤는 이전 설정(오므려 부르기 · 손 맞잡기)으로 그려져
    있어, 글(윗면 쓸기 · 오므려 종료)과 다를 수 있습니다.
