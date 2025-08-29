# ChromaVault - Premium Color Palette Platform 🎨

> AI-powered color palette curation platform with professional UI/UX design

## ✨ Features

### 🎨 Core Features
- **AI-Powered Color Generation** - Smart color palette suggestions using AI
- **Color Psychology Analysis** - Understand emotional impact of colors
- **Real-time Collaboration** - Share and edit palettes with team members
- **Advanced Search** - Find perfect palettes with smart filters
- **Export Options** - Multiple format exports (CSS, JSON, SVG, PNG)

### 💎 Premium UI/UX
- **Glassmorphism Design** - Modern glass effects with backdrop blur
- **Advanced Animations** - Smooth transitions and micro-interactions
- **Dark Theme** - Professional dark mode design
- **Responsive Layout** - Mobile-first responsive design
- **Interactive Hero Section** - Dynamic gradients following mouse movement

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Zustand** - State management

### Backend
- **Express.js** - Node.js web framework
- **PostgreSQL** - Primary database
- **Prisma ORM** - Database toolkit
- **JWT** - Authentication
- **Socket.io** - Real-time features

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/chromavault.git
cd chromavault

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Set up the database
npx prisma migrate dev
npx prisma generate

# Run development servers
npm run dev:server  # Terminal 1: Backend
npm run dev         # Terminal 2: Frontend
```

## 📊 Performance

- **Lighthouse Score**: 95+ Performance
- **First Paint**: < 1.5s
- **60 FPS** animations maintained

## 📄 License

MIT License - see LICENSE file for details

---

**ChromaVault** - *Discover Perfect Color Harmonies* 🎨✨
