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

성능 개선: 12프레임씩 16개의 WebP 시트로 묶고 첫 화면에서 압축 데이터를 선로딩한다. 세로 모바일용 288×512 중앙 구도는 총 1,259,614바이트(이전 3,901,886바이트 대비 67.7% 감소)이며, 가로·데스크톱용은 768×432다. 화면 비율이 바뀌면 해당 구도의 데이터로 교체한다. 전송 동시성은 3개, 디코딩 동시성은 1개, 유지하는 디코딩 시트는 주변 3개로 제한한다. 원본 Blob을 보관해 역방향 스크롤에서 재다운로드하지 않는다. 목표 진행도에는 95ms 감쇠를 적용하고, 준비된 중간 프레임을 순서대로 그린다. 멀리 떨어진 대표 프레임으로 건너뛰던 처리는 제거했다. 이전 개별 프레임 파일은 보관하지만 새 화면에서는 요청하지 않는다. 원본은 24fps이며 실제 기기의 네이티브 재생과 동등한 부드러움은 보장하지 않는다.

영상은 muted/playsinline으로 열리고 별도의 자동재생은 하지 않는다. 모바일 주소창의 높이 변화로는 재생을 중지하지 않으며, 화면 폭이 바뀌면 정지하고 배치를 갱신한다. 기존 3D 화면은 `?tour=3d`에서 제공하며 영상 오류 시 3D로 전환한다. 콘셉트 영상임을 표시하고 기존 상담 기능과 자간·간격을 유지한다.

`npm run check:film`은 영상 메타데이터가 없고 currentTime 설정이 실패하는 조건에서도 스크롤 프레임이 바뀌는지, 비동기 요청과 디코딩, 프레임 보간 방향, 역방향 스크롤 중 재다운로드 방지, 요청·메모리 제한, 영상 재생에서 스크롤로 전환, 주소창 높이 변화와 회전 처리를 검사한다. 실제 휴대폰에서의 부드러움은 별도 실기기 검증을 하지 않았다.
