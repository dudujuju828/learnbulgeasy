import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const EXTRA_HEAPS = [
  {
    name: 'Food: Fruits',
    description: 'Juicy fruits from the Bulgarian market',
    theme: 'Food',
    order: 11,
    words: [
      { en: 'apple', bg: 'ябълка', cyr: 'yabylka' },
      { en: 'banana', bg: 'банан', cyr: 'banan' },
      { en: 'orange', bg: 'портокал', cyr: 'portokal' },
      { en: 'strawberry', bg: 'ягода', cyr: 'yagoda' },
      { en: 'grape', bg: 'грозде', cyr: 'grozde' },
    ],
  },
  {
    name: 'Food: Drinks',
    description: 'Quench your thirst in Bulgarian',
    theme: 'Food',
    order: 12,
    words: [
      { en: 'coffee', bg: 'кафе', cyr: 'kafe' },
      { en: 'tea', bg: 'чай', cyr: 'chay' },
      { en: 'wine', bg: 'вино', cyr: 'vino' },
      { en: 'beer', bg: 'бира', cyr: 'bira' },
      { en: 'juice', bg: 'сок', cyr: 'sok' },
    ],
  },
  {
    name: 'Verbs: Movement',
    description: 'Get moving with Bulgarian action words',
    theme: 'Verbs',
    order: 13,
    words: [
      { en: 'to run', bg: 'тичам', cyr: 'ticham' },
      { en: 'to walk', bg: 'ходя', cyr: 'hodya' },
      { en: 'to sit', bg: 'седя', cyr: 'sedya' },
      { en: 'to stand', bg: 'стоя', cyr: 'stoya' },
      { en: 'to come', bg: 'идвам', cyr: 'idvam' },
    ],
  },
  {
    name: 'Travel: City Life',
    description: 'Navigate Bulgarian cities like a local',
    theme: 'Travel',
    order: 14,
    words: [
      { en: 'street', bg: 'улица', cyr: 'ulitsa' },
      { en: 'shop', bg: 'магазин', cyr: 'magazin' },
      { en: 'restaurant', bg: 'ресторант', cyr: 'restorant' },
      { en: 'hospital', bg: 'болница', cyr: 'bolnitsa' },
      { en: 'bank', bg: 'банка', cyr: 'banka' },
    ],
  },
  {
    name: 'Body: Face & Senses',
    description: 'The parts that help you experience the world',
    theme: 'Body',
    order: 15,
    words: [
      { en: 'ear', bg: 'ухо', cyr: 'uho' },
      { en: 'nose', bg: 'нос', cyr: 'nos' },
      { en: 'hair', bg: 'коса', cyr: 'kosa' },
      { en: 'heart', bg: 'сърце', cyr: 'sartse' },
      { en: 'back', bg: 'гръб', cyr: 'grab' },
    ],
  },
  {
    name: 'Emotions: Deeper Feelings',
    description: 'Express the full range of human emotion',
    theme: 'Emotions',
    order: 16,
    words: [
      { en: 'excited', bg: 'развълнуван', cyr: 'razvylnuvan' },
      { en: 'scared', bg: 'уплашен', cyr: 'uplashen' },
      { en: 'surprised', bg: 'изненадан', cyr: 'iznenadan' },
      { en: 'proud', bg: 'горд', cyr: 'gord' },
      { en: 'lonely', bg: 'сам', cyr: 'sam' },
    ],
  },
  {
    name: 'Objects: At Home',
    description: 'The furniture and fixtures of daily life',
    theme: 'Objects',
    order: 17,
    words: [
      { en: 'table', bg: 'маса', cyr: 'masa' },
      { en: 'chair', bg: 'стол', cyr: 'stol' },
      { en: 'bed', bg: 'легло', cyr: 'leglo' },
      { en: 'window', bg: 'прозорец', cyr: 'prozoretz' },
      { en: 'door', bg: 'врата', cyr: 'vrata' },
    ],
  },
  {
    name: 'Places: Nature',
    description: 'Bulgaria\'s beautiful natural landscapes',
    theme: 'Places',
    order: 18,
    words: [
      { en: 'mountain', bg: 'планина', cyr: 'planina' },
      { en: 'river', bg: 'река', cyr: 'reka' },
      { en: 'sea', bg: 'море', cyr: 'more' },
      { en: 'forest', bg: 'гора', cyr: 'gora' },
      { en: 'park', bg: 'парк', cyr: 'park' },
    ],
  },
  {
    name: 'Time: Days of the Week',
    description: 'Name every day of the Bulgarian week',
    theme: 'Time',
    order: 19,
    words: [
      { en: 'Monday', bg: 'понеделник', cyr: 'ponedelnik' },
      { en: 'Tuesday', bg: 'вторник', cyr: 'vtornik' },
      { en: 'Wednesday', bg: 'сряда', cyr: 'sryada' },
      { en: 'Thursday', bg: 'четвъртък', cyr: 'chetvartuk' },
      { en: 'Friday', bg: 'петък', cyr: 'petuk' },
    ],
  },
  {
    name: 'Numbers 6–10',
    description: 'Continue counting in Bulgarian',
    theme: 'Numbers',
    order: 20,
    words: [
      { en: 'six', bg: 'шест', cyr: 'shest' },
      { en: 'seven', bg: 'седем', cyr: 'sedem' },
      { en: 'eight', bg: 'осем', cyr: 'osem' },
      { en: 'nine', bg: 'девет', cyr: 'devet' },
      { en: 'ten', bg: 'десет', cyr: 'deset' },
    ],
  },
  {
    name: 'Actions: Daily Verbs',
    description: 'The verbs that drive everyday life',
    theme: 'Actions',
    order: 21,
    words: [
      { en: 'to cook', bg: 'готвя', cyr: 'gotvya' },
      { en: 'to work', bg: 'работя', cyr: 'rabotya' },
      { en: 'to read', bg: 'чета', cyr: 'cheta' },
      { en: 'to write', bg: 'пиша', cyr: 'pisha' },
      { en: 'to speak', bg: 'говоря', cyr: 'govorya' },
    ],
  },
  {
    name: 'Weather',
    description: 'Talk about the Bulgarian sky',
    theme: 'Weather',
    order: 22,
    words: [
      { en: 'sun', bg: 'слънце', cyr: 'slantse' },
      { en: 'rain', bg: 'дъжд', cyr: 'dazhd' },
      { en: 'snow', bg: 'сняг', cyr: 'snyag' },
      { en: 'wind', bg: 'вятър', cyr: 'vyatur' },
      { en: 'cloud', bg: 'облак', cyr: 'oblak' },
    ],
  },
  {
    name: 'Animals',
    description: 'Meet Bulgaria\'s furry and feathered friends',
    theme: 'Animals',
    order: 23,
    words: [
      { en: 'dog', bg: 'куче', cyr: 'kuche' },
      { en: 'cat', bg: 'котка', cyr: 'kotka' },
      { en: 'bird', bg: 'птица', cyr: 'ptitsa' },
      { en: 'fish', bg: 'риба', cyr: 'riba' },
      { en: 'horse', bg: 'кон', cyr: 'kon' },
    ],
  },
  {
    name: 'Clothes',
    description: 'Dress yourself in Bulgarian',
    theme: 'Clothes',
    order: 24,
    words: [
      { en: 'shirt', bg: 'риза', cyr: 'riza' },
      { en: 'pants', bg: 'панталон', cyr: 'pantalon' },
      { en: 'shoes', bg: 'обувки', cyr: 'obuvki' },
      { en: 'jacket', bg: 'яке', cyr: 'yake' },
      { en: 'hat', bg: 'шапка', cyr: 'shapka' },
    ],
  },
  {
    name: 'Adjectives: Describing Things',
    description: 'Paint a picture with Bulgarian descriptors',
    theme: 'Adjectives',
    order: 25,
    words: [
      { en: 'big', bg: 'голям', cyr: 'golyam' },
      { en: 'small', bg: 'малък', cyr: 'malak' },
      { en: 'hot', bg: 'горещ', cyr: 'goreshch' },
      { en: 'cold', bg: 'студен', cyr: 'studen' },
      { en: 'beautiful', bg: 'красив', cyr: 'krasiv' },
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

    const existingOrders = await sql`
      SELECT "order" FROM heaps WHERE "order" >= 11
    ` as { order: number }[]
    const existingOrderSet = new Set(existingOrders.map(r => r.order))

    const toInsert = EXTRA_HEAPS.filter(h => !existingOrderSet.has(h.order))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Extra heaps already seeded', inserted: 0 })
    }

    for (const heap of toInsert) {
      await sql`
        INSERT INTO heaps (name, description, theme, "order", words, map_id)
        VALUES (${heap.name}, ${heap.description}, ${heap.theme}, ${heap.order}, ${JSON.stringify(heap.words)}::jsonb, 1)
      `
    }

    return NextResponse.json({ success: true, message: `Seeded ${toInsert.length} extra heaps`, inserted: toInsert.length })
  } catch (err) {
    console.error('Seed-extra error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
