# ChromaVault 구현 워크플로우 가이드
## 재현 가능한 풀스택 개발 프로세스

---

## 🎯 목적
이 문서는 ChromaVault와 같은 풀스택 애플리케이션을 처음부터 구현할 때 따라야 할 체계적인 워크플로우를 제공합니다.

---

## 📋 사전 준비사항

### 필수 도구
- Node.js 20+
- PostgreSQL 14+
- Git
- Claude Code with SuperClaude
- VS Code 또는 Cursor

### 환경 설정
```bash
# PostgreSQL 설치 (macOS)
brew install postgresql@14
brew services start postgresql@14

# Node.js 버전 확인
node --version  # v20 이상

# Claude Code 설정
claude --version
```

---

## 🔄 단계별 워크플로우

### Phase 1: 프로젝트 초기화 (30분)

#### 1.1 프로젝트 생성
```bash
# Next.js 프로젝트 생성
npx create-next-app@latest chromavault \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir

cd chromavault
```

#### 1.2 백엔드 구조 설정
```bash
# 백엔드 디렉토리 생성
mkdir -p src/server/{routes,middleware,config,utils,sockets,services}

# TypeScript 설정
cat > tsconfig.server.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "./dist",
    "rootDir": "./src/server"
  },
  "include": ["src/server/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

#### 1.3 의존성 설치
```bash
# 백엔드 의존성
npm install express@4.19.2 cors helmet morgan \
  jsonwebtoken bcryptjs dotenv \
  express-rate-limit express-validator \
  socket.io prisma @prisma/client

# 개발 의존성
npm install -D @types/express@^4.17.21 @types/cors \
  @types/jsonwebtoken @types/bcryptjs \
  nodemon ts-node @types/node
```

---

### Phase 2: 데이터베이스 설정 (45분)

#### 2.1 PostgreSQL 데이터베이스 생성
```bash
# 데이터베이스 생성
createdb chromavault

# 연결 테스트
psql -d chromavault -c "SELECT version();"
```

#### 2.2 Prisma 초기화
```bash
# Prisma 초기화
npx prisma init

# 환경 변수 설정
echo 'DATABASE_URL="postgresql://localhost:5432/chromavault"' > .env
```

#### 2.3 스키마 정의
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String
  createdAt DateTime @default(now())
  palettes  Palette[]
}

model Palette {
  id        String   @id @default(uuid())
  name      String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  colors    Color[]
  createdAt DateTime @default(now())
}

model Color {
  id        String   @id @default(uuid())
  hex       String
  paletteId String
  palette   Palette  @relation(fields: [paletteId], references: [id])
}
```

#### 2.4 마이그레이션 실행
```bash
# 마이그레이션 생성 및 실행
npx prisma migrate dev --name init

# Prisma 클라이언트 생성
npx prisma generate

# 시드 데이터 생성
npx prisma db seed
```

---

### Phase 3: 백엔드 구현 (1시간)

#### 3.1 Express 서버 설정
```typescript
// src/server/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(helmet());
app.use(cors());
app.use(express.json());

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### 3.2 package.json 스크립트 추가
```json
{
  "scripts": {
    "dev": "next dev -p 3003",
    "dev:server": "nodemon src/server/index.ts",
    "build": "next build && tsc -p tsconfig.server.json",
    "start": "next start",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "prisma db seed"
  }
}
```

#### 3.3 API 라우트 구현
```typescript
// src/server/routes/palette.routes.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/palettes', async (req, res) => {
  const palettes = await prisma.palette.findMany({
    include: { colors: true }
  });
  res.json(palettes);
});

export default router;
```

---

### Phase 4: 프론트엔드 통합 (45분)

#### 4.1 API 프록시 설정
```typescript
// src/app/api/palettes/route.ts
export async function GET() {
  const response = await fetch('http://localhost:3001/api/v1/palettes');
  const data = await response.json();
  return Response.json(data);
}
```

#### 4.2 환경 변수
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### 4.3 페이지 구현
```tsx
// src/app/page.tsx
async function getPalettes() {
  const res = await fetch('http://localhost:3003/api/palettes');
  return res.json();
}

export default async function Home() {
  const palettes = await getPalettes();
  
  return (
    <div>
      <h1>ChromaVault</h1>
      {palettes.map(palette => (
        <div key={palette.id}>
          <h2>{palette.name}</h2>
          {/* 팔레트 표시 */}
        </div>
      ))}
    </div>
  );
}
```

---

### Phase 5: 테스트 및 검증 (30분)

#### 5.1 서버 시작
```bash
# 터미널 1: 백엔드
npm run dev:server

# 터미널 2: 프론트엔드
npm run dev
```

#### 5.2 API 테스트
```bash
# 헬스체크
curl http://localhost:3001/health

# 팔레트 조회
curl http://localhost:3001/api/v1/palettes
```

#### 5.3 브라우저 테스트
```bash
# 프론트엔드 열기
open http://localhost:3003
```

---

## 🛠️ 문제 해결 가이드

### Express 버전 충돌
```bash
# Express 5.x 오류 시
npm uninstall express
npm install express@4.19.2
npm install @types/express@^4.17.21 -D
```

### 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
brew services list | grep postgresql

# 재시작
brew services restart postgresql@14

# 연결 테스트
psql -U $USER -d postgres -c "\\l"
```

### 포트 충돌
```bash
# 사용 중인 포트 확인
lsof -i :3001
lsof -i :3003

# 프로세스 종료
kill -9 [PID]
```

### TypeScript 오류
```bash
# 타입 재생성
rm -rf node_modules @types
npm install
npx prisma generate
```

---

## 🚀 SuperClaude/Agent/MCP 활용법

### SuperClaude 명령어
```bash
# 구현
/sc:implement --feature "user authentication"

# 트러블슈팅
/sc:troubleshoot --issue "database connection"

# 분석
/sc:analyze --code "./src/server"

# 문서화
/sc:document --type "api"
```

### Agent 활용
```bash
# 백엔드 개발
Task: backend-dev
Context: "Implement JWT authentication"

# 프론트엔드 개발
Task: mobile-dev
Context: "Create responsive palette editor"

# 데이터베이스
Task: data-architect
Context: "Design optimal schema for color data"
```

### MCP TaskMaster
```bash
# 초기화
task-master init

# PRD 파싱
task-master parse-prd .taskmaster/docs/prd.txt

# 작업 관리
task-master next
task-master show [id]
task-master set-status --id=[id] --status=done
```

---

## ✅ 체크리스트

### 프로젝트 시작
- [ ] Node.js 20+ 설치
- [ ] PostgreSQL 설치 및 실행
- [ ] 프로젝트 디렉토리 생성
- [ ] Git 저장소 초기화

### 백엔드
- [ ] Express 서버 설정
- [ ] 데이터베이스 연결
- [ ] API 라우트 구현
- [ ] 인증 시스템
- [ ] 에러 처리

### 프론트엔드
- [ ] Next.js 설정
- [ ] API 프록시
- [ ] 페이지 구현
- [ ] 상태 관리
- [ ] UI 컴포넌트

### 통합
- [ ] API 연동 테스트
- [ ] 인증 플로우
- [ ] 실시간 기능
- [ ] 배포 준비

---

## 📚 추가 리소스

### 공식 문서
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/guide)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Manual](https://www.postgresql.org/docs)

### 유용한 도구
- [Postman](https://www.postman.com/) - API 테스트
- [TablePlus](https://tableplus.com/) - 데이터베이스 GUI
- [React DevTools](https://react.dev/learn/react-developer-tools)

---

## 💡 팁과 모범 사례

### 1. 단계적 개발
- 백엔드 먼저 구현
- API 테스트 후 프론트엔드 연결
- 기능별로 작은 단위로 구현

### 2. 버전 관리
- 의존성 버전 고정
- package-lock.json 커밋
- 환경별 설정 분리

### 3. 문서화
- API 문서 자동 생성
- 코드 주석 작성
- README 업데이트

### 4. 보안
- 환경 변수 사용
- 입력 검증
- SQL 인젝션 방지

---

**작성자**: Claude Opus 4.1  
**최종 업데이트**: 2025-01-29  
**버전**: 1.0.0

---

*이 워크플로우를 따르면 ChromaVault와 같은 풀스택 애플리케이션을 체계적으로 구현할 수 있습니다.*