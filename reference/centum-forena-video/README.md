# 센텀포레나 입장 영상 기준 이미지 v1

- 제작: 2026-09-08, built-in image_gen 사용.
- 선택 시공사: 올 인테리어 디자인 (@ol_interior_design).
- 실제 사진 출처: https://www.instagram.com/ol_interior_design/p/C3W27W0BI23/
- 원문 표기: 시공 완료 이미지 / Project - 센텀 포레나 리모델링. 게시일 2024-02-15.
- 원본 사진 6장은 ../instagram/centum-forena/ 에 보존.
- 평면도: 사용자가 제공한 floor-plan-user.png. 치수와 현재 시공 상태의 완전한 일치는 확인되지 않음.

## 결과

entrance-closed-v1.png / entrance-open-v1.png: 같은 시점의 닫힌 문과 열린 문 기준 이미지. 실제 사진의 마감, 몰딩, 문, 조명과 사용자 평면도를 참고한 AI 재구성 시안이다. 원본 시공사진이나 정확한 실측 3D 복원으로 표시하면 안 된다. 현관에서 안으로 바라보는 역방향 시점과 거실의 일부 가시성은 추정이 포함된다. v1에는 복도 끝 주방/거실 가시성이 평면도보다 강조되어 있어 실제 구조와 추가 대조가 필요하다.

아직 Flow 동영상 생성 및 사이트 반영은 하지 않았다. 사용자 최신 범위: 좌우 전환 없이 문을 열고 입장하는 장면 우선.

## Flow 연출 프롬프트

One continuous 8-second photoreal first-person apartment entrance shot. Start exactly on the supplied closed-door frame. Hold 0.5 seconds. Both smoked-glass door leaves smoothly swing on their outer vertical hinges toward the viewer and clear the central passage over 2.5 seconds, matching the open-door reference. Only after the doorway is clear, the camera glides gently forward 1.2 metres through the threshold into the foyer for the remaining 5 seconds, at steady eye height with a slow ease-out. No lateral panning, no turn, no zoom, no cut, no crossfade, no morphing. Preserve ivory panel molding, marble veining, brass pulls, chandelier positions and room arrangement. Real rigid door mechanics. Keep lighting and exposure stable as glass moves out of view. No people, hands, text, logos, or new furniture. Stop in the foyer, do not reveal a newly invented room beyond reference coverage.

두 이미지는 동일한 카메라 위치이므로, 두 장을 영상 전체의 시작/종료 프레임으로 고정하면 전진이 약해질 수 있다. 문 열림 구간의 시작/종료 기준으로 사용한 뒤 열린 프레임에서 전진 구간을 잇거나, 열린 이미지를 공간 참고로 사용한다.

## 이미지 생성 프롬프트: 열린 문

Use case: sketch-to-render.
Asset type: one cinematic 16:9 photoreal architectural keyframe for an image-to-video entrance walkthrough of a Korean renovated apartment. Create ONE full-bleed image, not a storyboard.
Input references: image 1 is the customer's floor plan and governs entry-to-living connectivity, not materials. Image 2 is the actual completed entrance corridor photographed looking toward the dark double door, and governs exact design vocabulary. Images 3 and 4 are actual completed living/kitchen photos, governing finishes and furnishings.
Primary request: Show the reverse viewpoint from just outside that dark framed double entrance partition, looking inward through its OPEN door leaves into the house. The viewer will walk forward through this doorway. The door is at the entrance, NOT another door floating in the middle of the living room. The plan's entrance is upper left, with a short foyer leading rightward into the kitchen/living circulation. Respect the structural room mass on the plan between the entry and far living room; only reveal what can plausibly be seen, do not invent a huge straight hotel corridor or remove walls to show the whole home.
Composition: eye height 1.5m, level corrected 26mm architectural lens, inviting human-scale apartment, doorway centered occupying foreground edges; two rigid dark espresso/black metal-and-tinted-glass leaves with thin champagne inset trim and long warm brass pulls, open inward approximately 80 degrees on outer vertical hinges, clear central passage. Beyond: ivory panel molding, subtle warm grey marble-veined pale floor, discreet crystal and brass ceiling light matching the actual corridor. A partial glimpse of the white paneled kitchen and distant muted blue upholstery only if physically visible. No side-to-side view, one forward axis. Preserve realistic standard 2.4m apartment ceiling and narrow entry proportions.
Style: polished editorial interior photography with refined soft 3500K lighting balanced with gentle daylight, controlled highlights, elegant ivory whites not yellow, tactile material detail, restrained contrast, accurate verticals. Keep actual design character, do not substitute generic beige minimalist interior. Natural lived-in scale, no people. Dark door edge and warm interior create depth.
Avoid text, logos, watermark, white picture borders, collage, floor-plan rendering, duplicated rooms, impossible door hardware, mirror symmetry of room layout, oversized mansion proportions, harsh fisheye distortion. This is a newly reconstructed viewpoint from supplied photo references, not a modification of the underlying portfolio photographs.

## 이미지 생성 프롬프트: 닫힌 문

Use case: precise-object-edit.
Edit the supplied generated apartment entrance keyframe to create its matching CLOSED-DOOR starting frame for a continuous door-opening video.
Keep the camera EXACTLY fixed: same 16:9 framing, lens, eye height, doorway jamb position, walls, marble floor veining, warm lighting, exposure, and overall colors. Change ONLY the two dark espresso/black framed tinted-glass hinged door leaves: rotate them on their existing OUTER hinges into a fully closed, coplanar position across this same doorway. The leaves meet in one neat vertical seam at center. Two matching long brass vertical pulls sit close to the center seam, one per leaf. Thin champagne decorative inset trim, dark bronze smoked glass upper panels and opaque dark lower panels matching the original. Interior remains behind these doors, subtly visible through dark glass without becoming a flat pasted photo. Doors are correctly fitted inside their frame; no extra doors, no extra frame, no new furniture. Realistic premium apartment partition door, not an exterior mansion gate. Preserve the soft warm light and identical scene geometry. Full bleed image, no captions, no logo or watermark, no storyboard.

