# ImageCard 상세설계

소스: `components/ImageCard.tsx`, `hooks/useImageCard.ts`, `hooks/useBoardImages.ts`

이미지 카드의 리사이즈 최소 크기는 작은 이미지도 배치할 수 있도록 `48 x 48`이다.

이미지 카드는 압축된 이미지 BLOB, MIME 타입, 파일명을 겸하는 라벨, 위치, 크기, 레이어를 가진다. v1 세이브 파일에서 마이그레이션된 HTTP(S) URL 이미지도 계속 표시한다.

- 이미지 도구 버튼은 숨겨진 파일 입력을 열며 JPEG, PNG, WebP만 받는다.
- 원본은 25 MiB 이하로 제한하고 Canvas에서 긴 변을 최대 1920px로 줄인 뒤 품질 0.82 WebP로 인코딩한다.
- 결과가 5 MiB보다 크면 크기와 품질을 단계적으로 더 낮춘다. WebP 인코딩을 지원하지 않는 브라우저는 PNG로 대체한다.
- 압축 결과의 비율을 유지하면서 최대 400x300인 초기 카드 크기를 계산한다.
- 압축 바이트는 `images.image_data` BLOB에, MIME 타입은 `images.mime_type`에 저장한다.
- 화면에서는 카드가 마운트된 동안만 Object URL을 만들고 언마운트나 데이터 교체 시 즉시 해제한다.
- 외부 클릭으로 편집을 끝낼 때 최신 위치와 크기를 React 상태에 반영하고 `BoardClient` autosave가 SQLite에 저장한다.
- 삭제는 로컬 컬렉션과 SQLite 행을 함께 제거한다.
