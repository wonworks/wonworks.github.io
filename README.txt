2030 HEY GANGNAM · TEAM 01 웹사이트
====================================

실행
  · 오프라인: TEAM01/index.html 을 더블클릭 (Chrome · Edge · Safari 최신 버전). 인터넷 연결이 필요 없습니다.
  · 온라인: 이 폴더를 GitHub 저장소에 그대로 올리고 GitHub Pages 를 켜면 같은 화면이 열립니다.
            (Settings → Pages → Branch: main / root → 주소/TEAM01/ 로 접속)

폴더 구조 (2030 FUTURE WORLD 웹사이트 제작 가이드 기준)
  TEAM01/
  ├── index.html                 조별 소개 페이지 — 3D 축제 지도 · 입장하기 · 8구역 투어 · 제품 쇼케이스
  ├── README.txt                 이 문서
  ├── css/team.css               조별 페이지 스타일
  ├── js/
  │   ├── team-data.js           제품 4종 문구 · 제품 사진 경로
  │   ├── team-scene.js          3D 축제 지도 (WebGL2, 외부 라이브러리 없음)
  │   └── team-pages.js          개인 제품 페이지 열기 · 공통 상단 바
  ├── assets/
  │   ├── images/                [빨간색 · 이미지]  로고 · 축제 지도 대체 이미지 · 제품 사진(products/)
  │   ├── models/                [파란색 · 3D 모델]  (조별 3D 지도는 코드로 생성 — 별도 GLB 없음)
  │   ├── videos/                [노란색 · 영상]
  │   ├── audio/                 (선택)
  │   ├── content/products.json  [초록색 · 텍스트·데이터]  제품 4종 문구 · 사양 · 시나리오
  │   └── fonts/                 한글 글꼴 (모든 페이지가 함께 쓰는 1벌)
  ├── PRODUCT01/                 비상 컨트롤 배지 (이다호)        index.html · assets/{css,js,images,models}
  ├── PRODUCT02/                 TIME DIAL — G/O GANGNAM OBJECT   index.html · css/ · assets/{images,models}
  ├── PRODUCT03/                 Echo Ring (홍재원)               index.html · css/ · js/ · assets/{images,models,videos,content}
  └── PRODUCT04/                 회전형 리본 스크린 펜스          index.html · css/ · js/

링크 규칙
  · 모든 페이지 진입 파일은 index.html
  · 개인 페이지 → 조 페이지: ../index.html   /   → 전체 프로젝트: ../../index.html
  · 개인 페이지 ↔ 다른 개인 페이지: ../PRODUCT0N/index.html
  · 조 페이지에서 [제품 자세히 보기]를 누르면 PRODUCT0N/index.html 이 공통 상단 바와 함께 열립니다
    (← 축제 지도 · 제품 소개 / 제품 체험 / 사용 안내 · ‹ 01 02 03 04 ›).

3D 모델 파일 두 벌에 대해
  각 제품 models/ 의 .glb 는 원본이고, 같은 폴더(또는 js/)의 .glb.js · model-data.js · product-glb-embed.js 는
  파일을 더블클릭해 열었을 때도 3D 가 보이도록 같은 모델을 담은 사본입니다. (브라우저는 오프라인 파일의 .glb 직접 읽기를 막음)

인터랙티브 요소 [보라색 · 별도 기능 명세]
  INTERACTION-01  스크롤 연동 3D — 스크롤에 따라 카메라가 7호선 → 게이트 → 푸드트럭 → 식사 → 뷰티 → 런웨이 → 무대 → 퇴장으로 이동,
                  탑뷰에서는 동선 지도로 전환. (PRODUCT03: assets/images/interaction/interaction-01-scroll-story.gif)
  INTERACTION-02  마우스 반응 3D 오브제 — 드래그·방향키 회전, 휠·핀치 확대, 시점 버튼. (PRODUCT03: interaction-02-mouse-3d.gif)
  INTERACTION-03  버튼 전환 — [입장하기] 로 7호선 출구까지 이동, 동선 화살표로 한 지점씩 이동, 01–04 로 제품 선택,
                  가림막 [체험 시작]/[초기화]. (PRODUCT03: interaction-03-buttons.gif)

글꼴
  Noto Sans CJK KR (SIL Open Font License 1.1) 에서 사이트에 쓰인 글자만 담은 부분 글꼴.
  Pretendard 가 설치된 PC 에서는 Pretendard 로 표시됩니다.
