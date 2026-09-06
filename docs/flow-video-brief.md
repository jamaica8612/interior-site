# 올 인테리어 디자인 · Google Flow 영상

상태: 2026-09-06 Google Flow에서 영상 생성 및 다운로드 완료. 기존 Google 계정으로 일반 Chrome에서 접속해 Veo 3.1 Quality, 1개 출력, 100 크레딧으로 생성했다.

- 프로젝트: https://flow.google.com/project/2416fb4c-3136-462d-bb55-325ddc7bf888
- 결과: https://flow.google.com/project/2416fb4c-3136-462d-bb55-325ddc7bf888/edit/5fa99b82-08ce-4a20-b5b3-288865d50ea6
- 원본: 8초 / 1280×720 / 24fps / H.264 + AAC / 7,018,573바이트. 원본은 로컬 다운로드 폴더에 보관.
- 홈페이지 파일: `assets/entrance-flow.mp4`, 음소거용 오디오 제거, H.264, 0.5초마다 키프레임, faststart, 2,199,041바이트.
- 포스터: 실제 영상의 첫 프레임 `assets/entrance-flow-poster.webp`.
- 사진 업로드는 Chrome 확장 권한으로 불가해 텍스트로 제작했다. 아래 사진은 업로드하지 않았다. 실제 영상은 참조 이미지와 동일한 공간이 아닌 별도의 AI 콘셉트다.
- 프레임 점검: 닫힌 월넛 문에서 시작해 문이 열리고 카메라가 거실로 전진하는 동작 확인. 실제 결과의 경첩은 프롬프트와 달리 오른쪽에 있다.

## 연출

- 8초, 가로 16:9, 가능한 최고 원본 해상도.
- 0–2초: 닫힌 월넛 현관문이 왼쪽 경첩을 중심으로 안쪽으로 열린다.
- 2–6초: 문이 열린 뒤 카메라가 문턱을 지나 거실로 천천히 들어간다.
- 6–8초: 오른쪽에서 햇살이 들어오는 거실을 보여주며 부드럽게 멈춘다.
- 문과 이동 경로는 화면 중앙에 두어 휴대폰 세로 화면에서도 잘리지 않게 한다.
- 사람, 손, 자막, 로고, 장면 전환, 가구 변형 없이 한 장면으로 만든다.

## 초기 연출 프롬프트

An 8-second continuous photorealistic architectural shot, landscape 16:9. Begin at eye level facing a fully CLOSED solid walnut entry door within a dark walnut frame. During seconds 0–2, the door smoothly swings inward on its LEFT hinge, revealing the warm apartment beyond; its hinge stays fixed and the door remains rigid. During seconds 2–6, the camera slowly glides forward through the clear doorway into the living room, with natural perspective and subtle parallax. During seconds 6–8, gently settle on the finished interior: walnut ceiling and walls, ivory linen sectional sofa, low travertine coffee table, sheer curtains, and warm afternoon sunlight entering floor-to-ceiling windows on the RIGHT. Match the reference room's architecture, furniture, materials, and lighting throughout. Keep the doorway opening, camera path, and principal furniture within the central third for mobile cropping. Quiet, inviting, premium editorial realism. One uninterrupted shot; no cuts, dissolves, digital zoom, object morphing, moving furniture, people, hands, text, or logos.

## 참조 이미지

- `assets/living-room.webp`: 완성된 거실의 재료, 가구, 채광을 위한 참조 또는 마지막 프레임.
- `assets/entrance.webp`: 문이 이미 열린 이미지이므로 닫힌 문에서 시작하는 첫 프레임으로 사용하지 않는다. 중간 구도 참조용.

## 홈페이지 연결과 확인

기본 첫 화면은 실제 Flow 영상이다. 재생 버튼은 영상의 실제 재생 시계에 맞춰 스크롤한다. 모바일 스크롤은 같은 영상의 192프레임을 Canvas에 그린다. 스크롤은 영상 메타데이터, 재생 권한, 영상 탐색에 의존하지 않는다.

2026-09-07 재개선: 같은 Flow 원본을 사용하는 WebGL 렌더러로 교체했다. 스크롤 전에 16개 시트를 모두 전송·해독·GPU 업로드하고, 준비가 끝난 뒤에만 캔버스를 표시한다. 스크롤 중에는 텍스처 선택·UV 지정·단일 draw만 수행한다. 디코딩 시트를 매번 버리고 다시 읽는 주변 캐시는 더 이상 사용하지 않는다.

세로 288×512 중앙 구도는 16요청, 1,259,614바이트이며 가로는 512×288이다. 어느 방향이든 RGBA 텍스처 본체는 108 MiB다. 이는 기기의 총 메모리 상한이 아니다. 이미지 해독 동시성은 1개, 전송 동시성은 3개이며 업로드 후 Image와 Blob URL을 해제한다. GPU 최대 텍스처 크기를 확인하고 방향 전환 때 이전 텍스처부터 해제한다. 프레임버퍼 긴 변은 1440px, DPR은 1.5 이하로 제한한다. WebGL 미지원·이미지 오류·컨텍스트 손실 시 기존 영상 재생을 사용할 수 있다.

80ms 감쇠로 목표 스크롤을 따라간다. 상속되는 hero 진행 CSS 변수를 film 모드에서 제거하고 opacity/transform을 해당 요소에 직접 적용했다. 레이아웃은 크기 변경 때만 읽고, 접근성 상태·텍스트·퍼센트는 값이 바뀔 때만 갱신한다. 진행선은 scaleX로 움직이고 영상 위 backdrop blur는 제거했다. 원본은 24fps이며 새 프레임을 합성하지 않는다. 준비 시간은 네트워크와 기기에 따라 달라진다. 재생 버튼은 선택 사항으로 유지한다.

참고 지침: [Emil Kowalski 디자인 엔지니어링 스킬](https://github.com/emilkowalski/skill/blob/main/skills/emil-design-eng/SKILL.md), [MDN WebGL 모범 사례](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices). GitHub 스킬의 성능 지침을 참고했으며 로컬 스킬로 설치한 것은 아니다.

영상은 muted/playsinline으로 열리고 별도의 자동재생은 하지 않는다. 모바일 주소창의 높이 변화로는 재생을 중지하지 않으며, 화면 폭이 바뀌면 정지하고 배치를 갱신한다. 기존 3D 화면은 `?tour=3d`에서 제공하며 영상 오류 시 3D로 전환한다. 콘셉트 영상임을 표시하고 기존 상담 기능과 자간·간격을 유지한다.


검증: Node 모의 환경에서 전체 텍스처 준비 전 표시 방지, 왕복 스크롤 중 추가 네트워크·해독·GPU 업로드 없음, 스크롤 핫 경로의 DOM geometry 읽기 없음, 영상 재생 전환, 준비 중 재생 거절·취소, 늦은 playing 이벤트, 방향 전환 중 해독 취소, WebGL 미지원·파일 오류·컨텍스트 손실 시 영상 대체 경로를 검사했다. WebGL 셰이더/UV는 코드 검토했으며 실제 브라우저의 GPU 실행 및 실제 휴대폰 프레임률은 측정하지 않았다.
