import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { insertHeapsDeduped } from '@/lib/seed'

const HEAPS = [
  {
    name: 'Greetings',
    description: 'Essential phrases for saying hello and goodbye',
    theme: 'Greetings',
    order: 1,
    words: [
      { en: 'hello', bg: 'здравей', cyr: 'zdravey' },
      { en: 'goodbye', bg: 'довиждане', cyr: 'dovizhdane' },
      { en: 'thank you', bg: 'благодаря', cyr: 'blagodarya' },
      { en: 'please', bg: 'моля', cyr: 'molya' },
      { en: 'excuse me', bg: 'извинете', cyr: 'izvinete' },
    ],
  },
  {
    name: 'Numbers 1–5',
    description: 'Count from one to five in Bulgarian',
    theme: 'Numbers',
    order: 2,
    words: [
      { en: 'one', bg: 'едно', cyr: 'edno' },
      { en: 'two', bg: 'две', cyr: 'dve' },
      { en: 'three', bg: 'три', cyr: 'tri' },
      { en: 'four', bg: 'четири', cyr: 'chetiri' },
      { en: 'five', bg: 'пет', cyr: 'pet' },
    ],
  },
  {
    name: 'Food: Kitchen Basics',
    description: 'Everyday staples you find in every kitchen',
    theme: 'Food',
    order: 3,
    words: [
      { en: 'bread', bg: 'хляб', cyr: 'hlyab' },
      { en: 'water', bg: 'вода', cyr: 'voda' },
      { en: 'milk', bg: 'мляко', cyr: 'mlyako' },
      { en: 'cheese', bg: 'сирене', cyr: 'sirene' },
      { en: 'butter', bg: 'масло', cyr: 'maslo' },
    ],
  },
  {
    name: 'Colors',
    description: 'Paint your world with Bulgarian color words',
    theme: 'Colors',
    order: 4,
    words: [
      { en: 'red', bg: 'червен', cyr: 'cherven' },
      { en: 'blue', bg: 'син', cyr: 'sin' },
      { en: 'green', bg: 'зелен', cyr: 'zelen' },
      { en: 'yellow', bg: 'жълт', cyr: 'zhalt' },
      { en: 'black', bg: 'черен', cyr: 'cheren' },
    ],
  },
  {
    name: 'Family',
    description: 'Words for the people closest to you',
    theme: 'Family',
    order: 5,
    words: [
      { en: 'mother', bg: 'майка', cyr: 'mayka' },
      { en: 'father', bg: 'баща', cyr: 'bashta' },
      { en: 'brother', bg: 'брат', cyr: 'brat' },
      { en: 'sister', bg: 'сестра', cyr: 'sestra' },
      { en: 'friend', bg: 'приятел', cyr: 'priyatel' },
    ],
  },
  {
    name: 'Body Parts',
    description: 'From head to toe in Bulgarian',
    theme: 'Body',
    order: 6,
    words: [
      { en: 'head', bg: 'глава', cyr: 'glava' },
      { en: 'hand', bg: 'ръка', cyr: 'raka' },
      { en: 'eye', bg: 'око', cyr: 'oko' },
      { en: 'mouth', bg: 'уста', cyr: 'usta' },
      { en: 'leg', bg: 'крак', cyr: 'krak' },
    ],
  },
  {
    name: 'Time',
    description: 'Talk about when things happen',
    theme: 'Time',
    order: 7,
    words: [
      { en: 'today', bg: 'днес', cyr: 'dnes' },
      { en: 'tomorrow', bg: 'утре', cyr: 'utre' },
      { en: 'yesterday', bg: 'вчера', cyr: 'vchera' },
      { en: 'morning', bg: 'сутрин', cyr: 'sutrin' },
      { en: 'night', bg: 'нощ', cyr: 'nosht' },
    ],
  },
  {
    name: 'Travel',
    description: 'Navigate Bulgaria like a local',
    theme: 'Travel',
    order: 8,
    words: [
      { en: 'train', bg: 'влак', cyr: 'vlak' },
      { en: 'bus', bg: 'автобус', cyr: 'avtobus' },
      { en: 'hotel', bg: 'хотел', cyr: 'hotel' },
      { en: 'airport', bg: 'летище', cyr: 'letishte' },
      { en: 'ticket', bg: 'билет', cyr: 'bilet' },
    ],
  },
  {
    name: 'Common Verbs',
    description: 'Actions you use every day',
    theme: 'Verbs',
    order: 9,
    words: [
      { en: 'to eat', bg: 'ям', cyr: 'yam' },
      { en: 'to drink', bg: 'пия', cyr: 'piya' },
      { en: 'to sleep', bg: 'спя', cyr: 'spya' },
      { en: 'to go', bg: 'отивам', cyr: 'otivam' },
      { en: 'to know', bg: 'зная', cyr: 'znaya' },
    ],
  },
  {
    name: 'Emotions',
    description: 'Express how you feel in Bulgarian',
    theme: 'Emotions',
    order: 10,
    words: [
      { en: 'happy', bg: 'щастлив', cyr: 'shtastliv' },
      { en: 'sad', bg: 'тъжен', cyr: 'tazhen' },
      { en: 'tired', bg: 'уморен', cyr: 'umoren' },
      { en: 'hungry', bg: 'гладен', cyr: 'gladen' },
      { en: 'angry', bg: 'ядосан', cyr: 'yadosan' },
    ],
  },
]

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-migration-secret')
  if (secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()
    const existing = await sql`SELECT COUNT(*) as count FROM heaps` as { count: string }[]
    if (parseInt(existing[0].count) > 0) {
      return NextResponse.json({ success: true, message: 'Already seeded', count: parseInt(existing[0].count) })
    }

    const { inserted, skipped, skippedWords } = await insertHeapsDeduped(sql, HEAPS, 1)

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} heaps (${skipped} duplicate words skipped)`,
      count: inserted,
      skipped,
      skippedWords,
    })
  } catch (err) {
    console.error('Seed error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
