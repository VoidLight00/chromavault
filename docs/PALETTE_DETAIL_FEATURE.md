# ChromaVault - Palette Detail Modal Feature Documentation

## Overview
ChromaVault의 팔레트 상세 뷰는 사용자가 색상 팔레트를 심층적으로 분석하고 활용할 수 있는 종합적인 도구입니다.

## Features

### 1. Interactive Modal View
- **Full-screen modal**: 팔레트 선택 시 전체 화면 모달로 표시
- **Smooth animations**: Framer Motion을 활용한 부드러운 전환 효과
- **Tab navigation**: Overview, AI 분석, 협업, 내보내기 탭 제공

### 2. AI-Powered Analysis

#### Color Harmony Analysis
- 색상 조화도 점수 (0-100%)
- 조화 타입 분석 (단색, 유사색, 보색, 삼원색 등)
- 시각적 조화도 표시

#### Accessibility Check
- WCAG AA/AAA 준수 여부
- 대비율 계산
- 가독성 점수

#### Emotional & Industry Analysis
- 색상이 전달하는 감정 분석
- 적합한 산업 분야 추천
- 브랜딩 활용 가이드

#### Smart Suggestions
- 보색 추천
- 유사색 추천
- 삼원색 조합 제안

### 3. Color Extraction
- 이미지에서 색상 추출
- 색상 클러스터링
- 색상 비율 분석

### 4. Palette Generation

#### Generation Modes
- **Mood-based**: 감정/분위기 기반 생성
  - Energetic (활기찬)
  - Calm (차분한)
  - Professional (전문적)
  - Playful (유쾌한)
  - Elegant (우아한)
  - Natural (자연친화적)
  - Bold (대담한)
  - Minimal (미니멀)

#### Style Options
- Monochromatic (단색)
- Analogous (유사색)
- Complementary (보색)
- Triadic (삼원색)
- Tetradic (사각색)
- Seasonal (계절별)
- Trendy (트렌드)

### 5. Export Options
- **CSS Variables**: `:root` CSS 커스텀 속성
- **JSON**: JavaScript/TypeScript 객체
- **SCSS**: Sass 변수
- **Adobe Swatch**: Creative Suite 호환 (준비 중)

## Technical Implementation

### File Structure
```
src/
├── components/
│   └── palette/
│       └── PaletteDetailModal.tsx    # 메인 모달 컴포넌트
├── hooks/
│   └── usePaletteAI.ts              # AI 기능 통합 Hook
└── lib/
    └── ai/
        ├── colorAnalyzer.ts          # 색상 분석 유틸리티
        ├── colorExtractor.ts         # 이미지 색상 추출
        └── paletteGenerator.ts       # 팔레트 생성기
```

### Dependencies
- `framer-motion`: 애니메이션
- `lucide-react`: 아이콘
- Canvas API: 이미지 처리
- TypeScript: 타입 안정성

## Usage

### Basic Usage
```tsx
import { PaletteDetailModal } from '@/components/palette/PaletteDetailModal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState(null);

  return (
    <PaletteDetailModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      palette={selectedPalette}
    />
  );
}
```

### Using AI Hook
```tsx
import { usePaletteAI } from '@/hooks/usePaletteAI';

function MyComponent() {
  const {
    analyzePalette,
    extractColorsFromImage,
    generateFromMood,
    generateFromColor
  } = usePaletteAI();

  // Analyze palette
  const analysis = await analyzePalette(['#FF0000', '#00FF00', '#0000FF']);

  // Extract from image
  const colors = await extractColorsFromImage(imageFile);

  // Generate from mood
  const palette = await generateFromMood('energetic', 5);

  // Generate from base color
  const variations = await generateFromColor('#FF0000', 'analogous', 5);
}
```

## Color Analysis Algorithms

### Harmony Detection
색상 간의 HSL 각도 차이를 계산하여 조화 타입을 판별:
- **Analogous**: 30° 이내
- **Complementary**: 150°-210°
- **Triadic**: 110°-130°
- **Custom**: 기타 조합

### Accessibility Calculation
WCAG 2.1 기준에 따른 대비율 계산:
- **AA Normal**: 4.5:1 이상
- **AA Large**: 3:1 이상
- **AAA Normal**: 7:1 이상
- **AAA Large**: 4.5:1 이상

### Emotional Mapping
HSL 값 기반 감정 매핑:
- **Hue**: 기본 감정 (빨강=열정, 파랑=신뢰 등)
- **Saturation**: 강도 (높음=강렬, 낮음=차분)
- **Lightness**: 무게감 (밝음=가벼움, 어두움=무거움)

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: AI 분석은 사용자 요청 시에만 실행
2. **Memoization**: 분석 결과 캐싱
3. **Debouncing**: 색상 변경 시 분석 디바운싱
4. **Image Sampling**: 이미지 색상 추출 시 품질 조절

### Performance Metrics
- Modal open animation: < 300ms
- AI analysis: < 2s
- Image extraction: < 1s
- Export generation: < 100ms

## Future Enhancements

### Planned Features
1. **Real-time Collaboration**
   - Socket.io 통합
   - 동시 편집
   - 실시간 커서 표시

2. **Advanced AI Features**
   - 트렌드 예측
   - 브랜드 색상 매칭
   - 시즌별 추천

3. **Extended Export Options**
   - Figma 플러그인
   - Sketch 파일
   - Adobe XD

4. **API Integration**
   - RESTful API
   - GraphQL
   - Webhook 지원

## API Reference

### Endpoints (To be implemented)
```
POST   /api/palette/analyze       # AI 분석
POST   /api/palette/generate      # 팔레트 생성
POST   /api/palette/extract       # 이미지 색상 추출
POST   /api/palette/save          # 팔레트 저장
GET    /api/palette/:id           # 팔레트 조회
PUT    /api/palette/:id           # 팔레트 수정
DELETE /api/palette/:id           # 팔레트 삭제
POST   /api/palette/:id/share     # 공유 링크 생성
```

## Testing

### Unit Tests
```bash
npm test src/lib/ai/colorAnalyzer.test.ts
npm test src/lib/ai/colorExtractor.test.ts
npm test src/lib/ai/paletteGenerator.test.ts
```

### Integration Tests
```bash
npm test src/hooks/usePaletteAI.test.ts
npm test src/components/palette/PaletteDetailModal.test.tsx
```

## Troubleshooting

### Common Issues

1. **Canvas not available**
   - 브라우저 호환성 확인
   - Server-side rendering 문제 체크

2. **Image extraction fails**
   - CORS 정책 확인
   - 이미지 형식 지원 여부

3. **Export not working**
   - Blob API 지원 확인
   - 다운로드 권한 체크

## Contributing
기여를 환영합니다! PR을 제출하기 전에 테스트를 실행해주세요.

## License
MIT

---

Created with ❤️ by ChromaVault Team