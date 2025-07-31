# Image Size Compressor

브라우저에서 이미지를 목표 파일 크기로 압축하는 순수 자바스크립트 라이브러리입니다.

## 특징

- 🚀 **순수 자바스크립트**: 외부 라이브러리 의존성 없음
- 🎯 **정확한 크기 제어**: 목표 KB 크기로 압축 (±5KB 오차 범위)
- 🔄 **이진 탐색 알고리즘**: 효율적인 품질 최적화
- 📱 **자동 스케일링**: 필요 시 이미지 크기 자동 조절
- 🖼️ **다중 포맷 지원**: JPEG, WebP 출력 지원
- 🌐 **브라우저 호환**: 최신 브라우저의 Canvas API 활용

## 데모

`index.html` 파일을 브라우저에서 열어 실시간 데모를 확인할 수 있습니다.

## 설치

이 라이브러리는 순수 자바스크립트로 작성되어 별도의 설치 과정이 필요하지 않습니다.

### 직접 포함

```html
<script src="image_size_compressor.js"></script>
```

### ES Module

```javascript
import { compressImageToTarget } from './image_size_compressor.js';
```

## 사용법

### 기본 사용법

```javascript
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    
    try {
        const compressedBlob = await compressImageToTarget(file, {
            targetSizeKB: 300,  // 목표 크기: 300KB
            mimeType: 'image/jpeg'
        });
        
        // 압축된 이미지 사용
        const url = URL.createObjectURL(compressedBlob);
        document.getElementById('result').src = url;
    } catch (error) {
        console.error('압축 실패:', error);
    }
});
```

### 고급 설정

```javascript
const options = {
    targetSizeKB: 500,          // 목표 크기 (필수)
    mimeType: 'image/webp',     // 출력 형식 (기본값: 'image/jpeg')
    maxWidth: 1920,             // 최대 너비 (기본값: null)
    maxHeight: 1080,            // 최대 높이 (기본값: null)
    maxIterations: 15,          // 품질 탐색 반복 횟수 (기본값: 10)
    minQuality: 0.1,            // 최소 품질 (기본값: 0.1)
    maxQuality: 0.95,           // 최대 품질 (기본값: 0.95)
    allowScaleDown: true        // 다운스케일 허용 (기본값: true)
};

const compressedBlob = await compressImageToTarget(file, options);
```

## API 참조

### `compressImageToTarget(file, options)`

이미지 파일을 목표 크기로 압축합니다.

#### 매개변수

- `file` (File|Blob): 압축할 원본 이미지 파일
- `options` (Object): 압축 설정 객체

#### 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `targetSizeKB` | number | - | 목표 파일 크기(KB) **[필수]** |
| `mimeType` | string | `'image/jpeg'` | 출력 이미지 형식 |
| `maxWidth` | number\|null | `null` | 최대 너비(픽셀) |
| `maxHeight` | number\|null | `null` | 최대 높이(픽셀) |
| `maxIterations` | number | `10` | 품질 최적화 반복 횟수 |
| `minQuality` | number | `0.1` | 최소 품질 (0.0 ~ 1.0) |
| `maxQuality` | number | `0.95` | 최대 품질 (0.0 ~ 1.0) |
| `allowScaleDown` | boolean | `true` | 이미지 크기 축소 허용 여부 |

#### 반환값

- `Promise<Blob>`: 압축된 이미지 Blob 객체

## 동작 원리

1. **이미지 로딩**: FileReader API를 사용하여 파일을 이미지 객체로 변환
2. **Canvas 렌더링**: 설정된 크기 제한에 따라 이미지를 Canvas에 그리기
3. **품질 최적화**: 이진 탐색으로 목표 크기에 맞는 최적 품질 찾기
4. **스케일 조정**: 품질만으로 목표에 도달하지 못할 경우 이미지 크기 축소
5. **결과 반환**: 최종 압축된 Blob 객체 생성

## 브라우저 지원

- Chrome 50+
- Firefox 53+
- Safari 10+
- Edge 79+

> Canvas.toBlob() API를 지원하는 모든 브라우저에서 동작합니다.

## 사용 예시

### 파일 업로드 후 자동 압축

```javascript
async function handleFileUpload(file) {
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 선택해주세요.');
        return;
    }
    
    const compressedBlob = await compressImageToTarget(file, {
        targetSizeKB: 200,
        mimeType: 'image/jpeg',
        maxWidth: 1200
    });
    
    console.log(`압축 완료: ${file.size} → ${compressedBlob.size} bytes`);
    return compressedBlob;
}
```

### 드래그 앤 드롭 지원

```javascript
const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            const compressed = await compressImageToTarget(file, {
                targetSizeKB: 300
            });
            // 압축된 이미지 처리
        }
    }
});
```

## 주의사항

- PNG 이미지의 경우 투명도 정보가 손실될 수 있습니다 (JPEG 변환 시)
- 매우 작은 이미지의 경우 목표 크기보다 클 수 있습니다
- WebP 형식은 지원하지 않는 브라우저가 있을 수 있습니다

## 라이선스

MIT License

## 기여

이슈 리포트와 풀 리퀘스트를 환영합니다.

## 변경 기록

### v1.0.0
- 초기 릴리스
- 기본 이미지 압축 기능
- 이진 탐색 품질 최적화
- 자동 스케일링 지원