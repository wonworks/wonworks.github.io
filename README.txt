2030 HEY GANGNAM · TEAM 01 공통 웹사이트

[실행]
- 오프라인: index.html을 더블클릭하면 인터넷 없이 전체 사이트가 열립니다.
- 온라인(깃허브 등): 이 폴더 구조 그대로 올리면 됩니다. 폴더째 끌어다 놓아야 하위 폴더가 함께 올라갑니다.

[폴더 구조]
index.html            공통 사이트(축제 지도 · 동선 · 제품 위치)
product-01.html       01 TIME DIAL
product-02.html       02 회전형 동선 가림막
product-03.html       03 Echo Ring
product-04.html       04 비상 컨트롤 배지
README.txt
assets/
  images/   이미지 (빨강)   common-img-* 공통 / p0N-* 제품별
  models/   3D 모델 (파랑)  p0N-*-data.js · p04-badge-glb-embed.js (GLB를 내장한 파일, 오프라인·온라인 공통)
            원본 .glb는 제품별 패키지(TEAM01_PRODUCT0N.zip)의 models/ 에 있습니다.
  videos/   영상 (노랑)     p0N-*.mp4
  content/  텍스트·데이터 (초록)  assets-manifest.json, p03-text.json
css/        스타일
fonts/      Pretendard 글꼴 (pretendard.css 안에 글꼴 내장)
js/         인터랙션 스크립트 (보라)

[인터랙티브 요소]
- index: 스크롤 따라 도시 → 축제장 → 동선 지도로 이어지는 3D 장면, 위치 선택 카드
- 01 TIME DIAL: 스크롤 회전 3D 다이얼, 축제장 걷기, 시나리오 영상
- 02 동선 가림막: 드래그 회전 3D 모델, 가림막 90° 회전 체험
- 03 Echo Ring: 30초 문제 체험(인파 속 놓치기 → 링 끼고 찾기), 스크롤 장면 영상, 3D 뷰어
- 04 비상 컨트롤 배지: 3D 뷰어, 시나리오 영상 5편

[파일 수]
깃허브 웹 업로드는 한 번에 100개 미만만 받으므로 전체를 91개로 줄였습니다. 가장 큰 파일도 5MB 이하입니다.
(스크립트·스타일 묶음, 스크롤 장면 프레임 시트 16장)

[제품별 에셋 패키지]
TEAM01_PRODUCT01~04.zip 은 제품별 images/ models/ videos/ 를 이름 규칙(IMG-NN, 3D-NN, VIDEO-NN)으로 정리한 별도 묶음입니다.
