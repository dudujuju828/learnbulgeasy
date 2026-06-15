import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { insertHeapsDeduped } from '@/lib/seed'

// Map 11 — "Essential Bulgarian": heaps 26–50, the everyday high-frequency words
// (pronouns, core verbs, yes/no, family, food, places) a beginner actually needs.
// Displayed as the 2nd map, right after Beginners Bay.
const MAP11_HEAPS = [
  {
    name: 'Basic Pronouns',
    description: 'I, you, he, she, we',
    theme: 'People',
    order: 26,
    words: [
      { en: 'I', bg: 'аз', cyr: 'az' },
      { en: 'you', bg: 'ти', cyr: 'ti' },
      { en: 'he', bg: 'той', cyr: 'toy' },
      { en: 'she', bg: 'тя', cyr: 'tya' },
      { en: 'we', bg: 'ние', cyr: 'nie' },
    ],
  },
  {
    name: 'More Pronouns',
    description: 'They, you, my, your, who',
    theme: 'People',
    order: 27,
    words: [
      { en: 'they', bg: 'те', cyr: 'te' },
      { en: 'you (formal)', bg: 'вие', cyr: 'vie' },
      { en: 'my', bg: 'мой', cyr: 'moy' },
      { en: 'your', bg: 'твой', cyr: 'tvoy' },
      { en: 'who', bg: 'кой', cyr: 'koy' },
    ],
  },
  {
    name: 'People',
    description: 'The people around you',
    theme: 'People',
    order: 28,
    words: [
      { en: 'person', bg: 'човек', cyr: 'chovek' },
      { en: 'man', bg: 'мъж', cyr: 'mazh' },
      { en: 'woman', bg: 'жена', cyr: 'zhena' },
      { en: 'child', bg: 'дете', cyr: 'dete' },
      { en: 'baby', bg: 'бебе', cyr: 'bebe' },
    ],
  },
  {
    name: 'Family',
    description: 'Your closest family',
    theme: 'People',
    order: 29,
    words: [
      { en: 'family', bg: 'семейство', cyr: 'semeystvo' },
      { en: 'husband', bg: 'съпруг', cyr: 'saprug' },
      { en: 'wife', bg: 'съпруга', cyr: 'sapruga' },
      { en: 'daughter', bg: 'дъщеря', cyr: 'dashterya' },
      { en: 'grandmother', bg: 'баба', cyr: 'baba' },
    ],
  },
  {
    name: 'Relatives',
    description: 'The wider family',
    theme: 'People',
    order: 30,
    words: [
      { en: 'grandfather', bg: 'дядо', cyr: 'dyado' },
      { en: 'grandson', bg: 'внук', cyr: 'vnuk' },
      { en: 'aunt', bg: 'леля', cyr: 'lelya' },
      { en: 'uncle', bg: 'чичо', cyr: 'chicho' },
      { en: 'cousin', bg: 'братовчед', cyr: 'bratovched' },
    ],
  },
  {
    name: 'Yes & No',
    description: 'Yes, no, good, bad',
    theme: 'Basics',
    order: 31,
    words: [
      { en: 'yes', bg: 'да', cyr: 'da' },
      { en: 'no', bg: 'не', cyr: 'ne' },
      { en: 'okay', bg: 'добре', cyr: 'dobre' },
      { en: 'good', bg: 'добър', cyr: 'dobar' },
      { en: 'bad', bg: 'лош', cyr: 'losh' },
    ],
  },
  {
    name: 'Joining Words',
    description: 'And, or, but, with, in',
    theme: 'Basics',
    order: 32,
    words: [
      { en: 'and', bg: 'и', cyr: 'i' },
      { en: 'or', bg: 'или', cyr: 'ili' },
      { en: 'but', bg: 'но', cyr: 'no' },
      { en: 'with', bg: 'с', cyr: 's' },
      { en: 'in', bg: 'в', cyr: 'v' },
    ],
  },
  {
    name: 'Position Words',
    description: 'On, under, here, there, now',
    theme: 'Basics',
    order: 33,
    words: [
      { en: 'on', bg: 'на', cyr: 'na' },
      { en: 'under', bg: 'под', cyr: 'pod' },
      { en: 'here', bg: 'тук', cyr: 'tuk' },
      { en: 'there', bg: 'там', cyr: 'tam' },
      { en: 'now', bg: 'сега', cyr: 'sega' },
    ],
  },
  {
    name: 'Directions',
    description: 'Up, down, left, right',
    theme: 'Basics',
    order: 34,
    words: [
      { en: 'up', bg: 'нагоре', cyr: 'nagore' },
      { en: 'down', bg: 'надолу', cyr: 'nadolu' },
      { en: 'left', bg: 'ляво', cyr: 'lyavo' },
      { en: 'right', bg: 'дясно', cyr: 'dyasno' },
      { en: 'map', bg: 'карта', cyr: 'karta' },
    ],
  },
  {
    name: 'Time Words',
    description: 'Always, never, time, hour',
    theme: 'Time',
    order: 35,
    words: [
      { en: 'always', bg: 'винаги', cyr: 'vinagi' },
      { en: 'never', bg: 'никога', cyr: 'nikoga' },
      { en: 'time', bg: 'време', cyr: 'vreme' },
      { en: 'hour', bg: 'час', cyr: 'chas' },
      { en: 'minute', bg: 'минута', cyr: 'minuta' },
    ],
  },
  {
    name: 'Days & Weeks',
    description: 'Day, week, month, year',
    theme: 'Time',
    order: 36,
    words: [
      { en: 'day', bg: 'ден', cyr: 'den' },
      { en: 'week', bg: 'седмица', cyr: 'sedmitsa' },
      { en: 'month', bg: 'месец', cyr: 'mesets' },
      { en: 'year', bg: 'година', cyr: 'godina' },
      { en: 'weekend', bg: 'уикенд', cyr: 'uikend' },
    ],
  },
  {
    name: 'Everyday Verbs',
    description: 'To be, to have, to want',
    theme: 'Verbs',
    order: 37,
    words: [
      { en: 'to be', bg: 'съм', cyr: 'sam' },
      { en: 'to have', bg: 'имам', cyr: 'imam' },
      { en: 'to do', bg: 'правя', cyr: 'pravya' },
      { en: 'to want', bg: 'искам', cyr: 'iskam' },
      { en: 'can', bg: 'мога', cyr: 'moga' },
    ],
  },
  {
    name: 'Action Verbs',
    description: 'To love, to see, to buy',
    theme: 'Verbs',
    order: 38,
    words: [
      { en: 'to love', bg: 'обичам', cyr: 'obicham' },
      { en: 'to see', bg: 'виждам', cyr: 'vizhdam' },
      { en: 'to buy', bg: 'купувам', cyr: 'kupuvam' },
      { en: 'to give', bg: 'давам', cyr: 'davam' },
      { en: 'to take', bg: 'вземам', cyr: 'vzemam' },
    ],
  },
  {
    name: 'Useful Verbs',
    description: 'To say, to think, to wait',
    theme: 'Verbs',
    order: 39,
    words: [
      { en: 'to say', bg: 'казвам', cyr: 'kazvam' },
      { en: 'to think', bg: 'мисля', cyr: 'mislya' },
      { en: 'to understand', bg: 'разбирам', cyr: 'razbiram' },
      { en: 'to wait', bg: 'чакам', cyr: 'chakam' },
      { en: 'to remember', bg: 'помня', cyr: 'pomnya' },
    ],
  },
  {
    name: 'Doing Things',
    description: 'To pay, to open, to close',
    theme: 'Verbs',
    order: 40,
    words: [
      { en: 'to pay', bg: 'плащам', cyr: 'plashtam' },
      { en: 'must', bg: 'трябва', cyr: 'tryabva' },
      { en: 'to open', bg: 'отворя', cyr: 'otvorya' },
      { en: 'to close', bg: 'затворя', cyr: 'zatvorya' },
      { en: 'help', bg: 'помощ', cyr: 'pomosht' },
    ],
  },
  {
    name: 'Question Words',
    description: 'What, when, where, why, how',
    theme: 'Basics',
    order: 41,
    words: [
      { en: 'what', bg: 'какво', cyr: 'kakvo' },
      { en: 'when', bg: 'кога', cyr: 'koga' },
      { en: 'where', bg: 'къде', cyr: 'kade' },
      { en: 'why', bg: 'защо', cyr: 'zashto' },
      { en: 'how', bg: 'как', cyr: 'kak' },
    ],
  },
  {
    name: 'Personal Info',
    description: 'Name, address, number',
    theme: 'Basics',
    order: 42,
    words: [
      { en: 'name', bg: 'име', cyr: 'ime' },
      { en: 'address', bg: 'адрес', cyr: 'adres' },
      { en: 'number', bg: 'номер', cyr: 'nomer' },
      { en: 'question', bg: 'въпрос', cyr: 'vapros' },
      { en: 'answer', bg: 'отговор', cyr: 'otgovor' },
    ],
  },
  {
    name: 'Food',
    description: 'Food, meat, chicken, egg',
    theme: 'Food',
    order: 43,
    words: [
      { en: 'food', bg: 'храна', cyr: 'hrana' },
      { en: 'meat', bg: 'месо', cyr: 'meso' },
      { en: 'chicken', bg: 'пиле', cyr: 'pile' },
      { en: 'egg', bg: 'яйце', cyr: 'yaytse' },
      { en: 'soup', bg: 'супа', cyr: 'supa' },
    ],
  },
  {
    name: 'Fruit & Veg',
    description: 'Fruit, vegetable, rice, sugar',
    theme: 'Food',
    order: 44,
    words: [
      { en: 'fruit', bg: 'плод', cyr: 'plod' },
      { en: 'vegetable', bg: 'зеленчук', cyr: 'zelenchuk' },
      { en: 'potato', bg: 'картоф', cyr: 'kartof' },
      { en: 'rice', bg: 'ориз', cyr: 'oriz' },
      { en: 'sugar', bg: 'захар', cyr: 'zahar' },
    ],
  },
  {
    name: 'The Home',
    description: 'Home, room, kitchen, bathroom',
    theme: 'Places',
    order: 45,
    words: [
      { en: 'home', bg: 'дом', cyr: 'dom' },
      { en: 'room', bg: 'стая', cyr: 'staya' },
      { en: 'bedroom', bg: 'спалня', cyr: 'spalnya' },
      { en: 'kitchen', bg: 'кухня', cyr: 'kuhnya' },
      { en: 'bathroom', bg: 'баня', cyr: 'banya' },
    ],
  },
  {
    name: 'Around Town',
    description: 'Station, city, village, market',
    theme: 'Places',
    order: 46,
    words: [
      { en: 'station', bg: 'гара', cyr: 'gara' },
      { en: 'city', bg: 'град', cyr: 'grad' },
      { en: 'village', bg: 'село', cyr: 'selo' },
      { en: 'market', bg: 'пазар', cyr: 'pazar' },
      { en: 'toilet', bg: 'тоалетна', cyr: 'toaletna' },
    ],
  },
  {
    name: 'Open & Closed',
    description: 'Open, closed, clock, shoe',
    theme: 'Basics',
    order: 47,
    words: [
      { en: 'open', bg: 'отворен', cyr: 'otvoren' },
      { en: 'closed', bg: 'затворен', cyr: 'zatvoren' },
      { en: 'clock', bg: 'часовник', cyr: 'chasovnik' },
      { en: 'shoe', bg: 'обувка', cyr: 'obuvka' },
      { en: 'bottle', bg: 'бутилка', cyr: 'butilka' },
    ],
  },
  {
    name: 'Money & Life',
    description: 'Money, price, bill, love',
    theme: 'Basics',
    order: 48,
    words: [
      { en: 'money', bg: 'пари', cyr: 'pari' },
      { en: 'price', bg: 'цена', cyr: 'tsena' },
      { en: 'bill', bg: 'сметка', cyr: 'smetka' },
      { en: 'love', bg: 'любов', cyr: 'lyubov' },
      { en: 'salt', bg: 'сол', cyr: 'sol' },
    ],
  },
  {
    name: 'Size & Speed',
    description: 'Long, short, tall, fast',
    theme: 'Basics',
    order: 49,
    words: [
      { en: 'long', bg: 'дълъг', cyr: 'dalag' },
      { en: 'short', bg: 'къс', cyr: 'kas' },
      { en: 'tall', bg: 'висок', cyr: 'visok' },
      { en: 'low', bg: 'нисък', cyr: 'nisak' },
      { en: 'fast', bg: 'бърз', cyr: 'barz' },
    ],
  },
  {
    name: 'Describing Things',
    description: 'Slow, easy, warm, cool',
    theme: 'Basics',
    order: 50,
    words: [
      { en: 'slow', bg: 'бавен', cyr: 'baven' },
      { en: 'easy', bg: 'лесен', cyr: 'lesen' },
      { en: 'warm', bg: 'топъл', cyr: 'topal' },
      { en: 'cool', bg: 'хладен', cyr: 'hladen' },
      { en: 'earth', bg: 'земя', cyr: 'zemya' },
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
      SELECT "order" FROM heaps WHERE "order" >= 26 AND "order" <= 50 AND map_id = 11
    ` as { order: number }[]
    const existingOrderSet = new Set(existingOrders.map(r => r.order))

    const toInsert = MAP11_HEAPS.filter(h => !existingOrderSet.has(h.order))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Map 11 heaps already seeded', inserted: 0 })
    }

    const { inserted, skipped, skippedWords } = await insertHeapsDeduped(sql, toInsert, 11)

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} Map 11 heaps (${skipped} duplicate words skipped)`,
      inserted,
      skipped,
      skippedWords,
    })
  } catch (err) {
    console.error('Seed-map11 error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
