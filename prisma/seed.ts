import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create users
  console.log('👤 Creating users...')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@chromavault.com' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@chromavault.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isVerified: true,
    },
  })

  const proUser = await prisma.user.upsert({
    where: { email: 'pro@chromavault.com' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'pro@chromavault.com',
      password: hashedPassword,
      name: 'Pro Designer',
      role: 'PRO',
      isVerified: true,
    },
  })

  const johnUser = await prisma.user.upsert({
    where: { email: 'user@chromavault.com' },
    update: {},
    create: {
      id: '33333333-3333-3333-3333-333333333333',
      email: 'user@chromavault.com',
      password: hashedPassword,
      name: 'John Doe',
      role: 'USER',
      isVerified: true,
    },
  })

  const janeUser = await prisma.user.upsert({
    where: { email: 'jane@chromavault.com' },
    update: {},
    create: {
      id: '44444444-4444-4444-4444-444444444444',
      email: 'jane@chromavault.com',
      password: hashedPassword,
      name: 'Jane Smith',
      role: 'USER',
      isVerified: true,
    },
  })

  const alexUser = await prisma.user.upsert({
    where: { email: 'designer@chromavault.com' },
    update: {},
    create: {
      id: '55555555-5555-5555-5555-555555555555',
      email: 'designer@chromavault.com',
      password: hashedPassword,
      name: 'Alex Designer',
      role: 'PRO',
      isVerified: true,
    },
  })

  console.log(`✓ Created users: ${[admin, proUser, johnUser, janeUser, alexUser].map(u => u.name).join(', ')}`)

  // Create tags
  console.log('🏷️ Creating tags...')
  const minimalistTag = await prisma.tag.upsert({
    where: { slug: 'minimalist' },
    update: {},
    create: {
      id: 't1111111-1111-1111-1111-111111111111',
      name: 'minimalist',
      slug: 'minimalist',
      description: 'Clean and simple color schemes',
      usageCount: 142,
    },
  })

  const vibrantTag = await prisma.tag.upsert({
    where: { slug: 'vibrant' },
    update: {},
    create: {
      id: 't2222222-2222-2222-2222-222222222222',
      name: 'vibrant',
      slug: 'vibrant',
      description: 'Bold and energetic colors',
      usageCount: 98,
    },
  })

  const natureTag = await prisma.tag.upsert({
    where: { slug: 'nature' },
    update: {},
    create: {
      id: 't3333333-3333-3333-3333-333333333333',
      name: 'nature',
      slug: 'nature',
      description: 'Colors from the natural world',
      usageCount: 234,
    },
  })

  const retroTag = await prisma.tag.upsert({
    where: { slug: 'retro' },
    update: {},
    create: {
      id: 't4444444-4444-4444-4444-444444444444',
      name: 'retro',
      slug: 'retro',
      description: 'Vintage and nostalgic palettes',
      usageCount: 76,
    },
  })

  const professionalTag = await prisma.tag.upsert({
    where: { slug: 'professional' },
    update: {},
    create: {
      id: 't5555555-5555-5555-5555-555555555555',
      name: 'professional',
      slug: 'professional',
      description: 'Business and corporate colors',
      usageCount: 189,
    },
  })

  console.log('✓ Created tags')

  // Create palettes with colors
  console.log('🎨 Creating palettes...')
  
  // Ocean Breeze palette
  const oceanPalette = await prisma.palette.upsert({
    where: { slug: 'ocean-breeze' },
    update: {},
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Ocean Breeze',
      description: 'Calming blues and aquas inspired by the sea',
      slug: 'ocean-breeze',
      isPublic: true,
      isFeatured: true,
      userId: proUser.id,
      viewCount: 1250,
      downloadCount: 340,
      colors: {
        create: [
          {
            id: 'c1111111-1111-1111-1111-111111111111',
            hex: '#0077BE',
            rgb: { r: 0, g: 119, b: 190 },
            hsl: { h: 202, s: 100, l: 37 },
            lab: { l: 48, a: -12, b: -42 },
            name: 'Ocean Blue',
            position: 0,
          },
          {
            id: 'c2222222-2222-2222-2222-222222222222',
            hex: '#40E0D0',
            rgb: { r: 64, g: 224, b: 208 },
            hsl: { h: 174, s: 71, l: 56 },
            lab: { l: 83, a: -38, b: -7 },
            name: 'Turquoise',
            position: 1,
          },
          {
            id: 'c3333333-3333-3333-3333-333333333333',
            hex: '#89CFF0',
            rgb: { r: 137, g: 207, b: 240 },
            hsl: { h: 199, s: 77, l: 74 },
            lab: { l: 80, a: -20, b: -23 },
            name: 'Baby Blue',
            position: 2,
          },
          {
            id: 'c4444444-4444-4444-4444-444444444444',
            hex: '#F0F8FF',
            rgb: { r: 240, g: 248, b: 255 },
            hsl: { h: 208, s: 100, l: 97 },
            lab: { l: 98, a: -3, b: -5 },
            name: 'Alice Blue',
            position: 3,
          },
          {
            id: 'c5555555-5555-5555-5555-555555555555',
            hex: '#004C6D',
            rgb: { r: 0, g: 76, b: 109 },
            hsl: { h: 198, s: 100, l: 21 },
            lab: { l: 30, a: -8, b: -25 },
            name: 'Deep Sea',
            position: 4,
          },
        ],
      },
      tags: {
        create: [
          { tag: { connect: { id: natureTag.id } } },
        ],
      },
    },
  })

  // Sunset Glow palette
  const sunsetPalette = await prisma.palette.upsert({
    where: { slug: 'sunset-glow' },
    update: {},
    create: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Sunset Glow',
      description: 'Warm oranges and pinks from golden hour',
      slug: 'sunset-glow',
      isPublic: true,
      isFeatured: true,
      userId: proUser.id,
      viewCount: 980,
      downloadCount: 210,
      colors: {
        create: [
          {
            id: 'c6666666-6666-6666-6666-666666666666',
            hex: '#FF6B6B',
            rgb: { r: 255, g: 107, b: 107 },
            hsl: { h: 0, s: 100, l: 71 },
            lab: { l: 61, a: 52, b: 32 },
            name: 'Coral',
            position: 0,
          },
          {
            id: 'c7777777-7777-7777-7777-777777777777',
            hex: '#FFE66D',
            rgb: { r: 255, g: 230, b: 109 },
            hsl: { h: 50, s: 100, l: 71 },
            lab: { l: 91, a: -2, b: 64 },
            name: 'Golden',
            position: 1,
          },
          {
            id: 'c8888888-8888-8888-8888-888888888888',
            hex: '#FF8C42',
            rgb: { r: 255, g: 140, b: 66 },
            hsl: { h: 23, s: 100, l: 63 },
            lab: { l: 67, a: 37, b: 52 },
            name: 'Orange',
            position: 2,
          },
          {
            id: 'c9999999-9999-9999-9999-999999999999',
            hex: '#FFA5A5',
            rgb: { r: 255, g: 165, b: 165 },
            hsl: { h: 0, s: 100, l: 82 },
            lab: { l: 74, a: 32, b: 18 },
            name: 'Light Pink',
            position: 3,
          },
          {
            id: 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            hex: '#C73E1D',
            rgb: { r: 199, g: 62, b: 29 },
            hsl: { h: 12, s: 75, l: 45 },
            lab: { l: 42, a: 45, b: 45 },
            name: 'Burnt Orange',
            position: 4,
          },
        ],
      },
      tags: {
        create: [
          { tag: { connect: { id: natureTag.id } } },
          { tag: { connect: { id: vibrantTag.id } } },
        ],
      },
    },
  })

  // Minimal Black palette
  const minimalPalette = await prisma.palette.upsert({
    where: { slug: 'minimal-black' },
    update: {},
    create: {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      name: 'Minimal Black',
      description: 'Monochromatic elegance',
      slug: 'minimal-black',
      isPublic: true,
      isFeatured: true,
      userId: alexUser.id,
      viewCount: 2100,
      downloadCount: 560,
      colors: {
        create: [
          {
            id: 'cbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            hex: '#000000',
            rgb: { r: 0, g: 0, b: 0 },
            hsl: { h: 0, s: 0, l: 0 },
            lab: { l: 0, a: 0, b: 0 },
            name: 'Pure Black',
            position: 0,
          },
          {
            id: 'cbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            hex: '#2B2B2B',
            rgb: { r: 43, g: 43, b: 43 },
            hsl: { h: 0, s: 0, l: 17 },
            lab: { l: 18, a: 0, b: 0 },
            name: 'Charcoal',
            position: 1,
          },
          {
            id: 'cbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            hex: '#555555',
            rgb: { r: 85, g: 85, b: 85 },
            hsl: { h: 0, s: 0, l: 33 },
            lab: { l: 36, a: 0, b: 0 },
            name: 'Dark Gray',
            position: 2,
          },
          {
            id: 'cbbbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            hex: '#808080',
            rgb: { r: 128, g: 128, b: 128 },
            hsl: { h: 0, s: 0, l: 50 },
            lab: { l: 54, a: 0, b: 0 },
            name: 'Gray',
            position: 3,
          },
          {
            id: 'cbbbbbb5-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            hex: '#FFFFFF',
            rgb: { r: 255, g: 255, b: 255 },
            hsl: { h: 0, s: 0, l: 100 },
            lab: { l: 100, a: 0, b: 0 },
            name: 'White',
            position: 4,
          },
        ],
      },
      tags: {
        create: [
          { tag: { connect: { id: minimalistTag.id } } },
        ],
      },
    },
  })

  console.log(`✓ Created palettes: Ocean Breeze, Sunset Glow, Minimal Black`)

  // Create some favorites
  console.log('❤️ Creating favorites...')
  await prisma.favorite.createMany({
    data: [
      {
        id: 'f1111111-1111-1111-1111-111111111111',
        userId: johnUser.id,
        paletteId: oceanPalette.id,
      },
      {
        id: 'f2222222-2222-2222-2222-222222222222',
        userId: johnUser.id,
        paletteId: minimalPalette.id,
      },
    ],
    skipDuplicates: true,
  })

  // Create some ratings
  console.log('⭐ Creating ratings...')
  await prisma.rating.createMany({
    data: [
      {
        id: 'r1111111-1111-1111-1111-111111111111',
        score: 5,
        userId: johnUser.id,
        paletteId: oceanPalette.id,
      },
      {
        id: 'r2222222-2222-2222-2222-222222222222',
        score: 4,
        userId: janeUser.id,
        paletteId: oceanPalette.id,
      },
    ],
    skipDuplicates: true,
  })

  // Create some comments
  console.log('💬 Creating comments...')
  await prisma.comment.createMany({
    data: [
      {
        id: 'cm111111-1111-1111-1111-111111111111',
        content: 'Love these ocean colors! Perfect for my beach-themed website.',
        userId: johnUser.id,
        paletteId: oceanPalette.id,
      },
      {
        id: 'cm222222-2222-2222-2222-222222222222',
        content: 'The minimalist approach is exactly what I was looking for.',
        userId: janeUser.id,
        paletteId: minimalPalette.id,
      },
    ],
    skipDuplicates: true,
  })

  console.log('🌱 Database seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })