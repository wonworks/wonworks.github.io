2030 HEY GANGNAM · 강남페스티벌 — TEAM 01 웹사이트

[페이지]
index.html        공통 웹사이트 (인트로 → 3D 축제 지도 8구역 → MCU AI → 제품 4종)
product-01.html   01 TIME DIAL · GANGNAM OBJECT (새 버전)
product-02.html   02 회전형 리본 스크린 펜스 (새 버전)
product-03.html   03 Echo Ring · 홍재원 (새 버전)
product-04.html   04 독립 블루투스 비상 컨트롤 배지 · 이다호 (새 버전)

[폴더]  파일 이름 앞 common- = 공통, p01~p04- = 제품별
assets/images/    이미지
assets/models/    3D 모델 GLB
assets/videos/    영상 (p02 작동 영상, p03 메인 영상, p04 시나리오 5편)
assets/content/   텍스트·데이터 (p03-text.json, assets-manifest.json 에셋 목록)
css/              스타일 (fonts.css = 공통 글꼴)
fonts/            Pretendard 가변 글꼴 (사이트에 쓰인 글자 + 자주 쓰는 한글 2,350자)
js/               스크립트 (*-bridge.js = 공통 사이트 안에서 열릴 때 상단 바 연결)

[글꼴]
모든 페이지가 fonts/PretendardVariable.woff 하나를 씁니다. 인터넷 글꼴(Google Fonts, CDN)을 쓰지 않습니다.
새 글자를 많이 추가했다면 원본 Pretendard로 글꼴 파일을 다시 만들어야 그 글자도 Pretendard로 보입니다.

[최적화]
- 이미지: JPG·PNG → WebP 변환, 전체 재압축 (화면 아래쪽 이미지는 지연 로딩)
- 영상: H.264 재인코딩, 해상도 유지 (Echo Ring 메인 영상 10.2MB → 1.6MB)
- 3D 모델: 인덱스 32비트 → 16비트(무손실), 모델 안 텍스처 재압축
- 코드: JS·CSS 압축(minify), HTML 주석 제거
- 글꼴: Pretendard 1개로 통일, 쓰인 글자만 담고 미리 불러오기
- 더블클릭용 모델 내장본(*-data.js 등 약 13MB) 삭제 → 서버(GitHub Pages)에서 여는 용도

[여는 방법]
GitHub Pages 또는 로컬 서버에서 여세요.  예) 이 폴더에서  python -m http.server  →  http://localhost:8000
더블클릭(file://)으로 열면 3D 모델이 보이지 않습니다. 반드시 서버에서 여세요.

[참고]
product-01: 시나리오 영상 자리는 assets/videos/p01-scenario.mp4 (+ assets/images/p01-scenario-poster.jpg)를 넣으면 나옵니다. 현재 파일 없음.
three.js 라이선스: assets/content/p02-three-LICENSE.txt
