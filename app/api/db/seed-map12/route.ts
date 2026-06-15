import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { insertHeapsDeduped } from '@/lib/seed'

// Map 12 — "Everyday Vocabulary": heaps 251–275, a second high-frequency batch
// (more people, core verbs, describing words, connectors, time, numbers/quantity,
// food, places/travel, shopping, body, health, weather, nature, clothing, home).
// Uses the 'essential' theme accent, the non-scenic look reserved for practical
// vocabulary maps (same as Map 11).
//
// NOTE: map_id 12 still needs to be registered in app/api/db/migrate/route.ts —
// add an `INSERT INTO maps (id, name, theme, order_index, description) VALUES
// (12, 'Everyday Vocabulary', 'essential', <order_index>, '...')` row (and any
// order_index slide needed) before this seed is run.
const MAP12_HEAPS = [
  {
    name: 'People & Doing',
    description: 'People, son, and your first new verbs',
    theme: 'essential',
    order: 251,
    words: [
      { en: 'people', bg: 'хора', cyr: 'hora' },
      { en: 'son', bg: 'синът', cyr: 'sinat' },
      { en: 'to make', bg: 'създавам', cyr: 'sazdavam' },
      { en: 'to listen', bg: 'слушам', cyr: 'slusham' },
      { en: 'to need', bg: 'нуждая се', cyr: 'nuzhdaya se' },
    ],
  },
  {
    name: 'Everyday Verbs',
    description: 'To ask, play, clean, show, put',
    theme: 'essential',
    order: 252,
    words: [
      { en: 'to ask', bg: 'питам', cyr: 'pitam' },
      { en: 'to play', bg: 'играя', cyr: 'igraya' },
      { en: 'to clean', bg: 'чистя', cyr: 'chistya' },
      { en: 'to show', bg: 'показвам', cyr: 'pokazvam' },
      { en: 'to put', bg: 'слагам', cyr: 'slagam' },
    ],
  },
  {
    name: 'Learning Verbs',
    description: 'To keep, learn, teach, forget, try',
    theme: 'essential',
    order: 253,
    words: [
      { en: 'to keep', bg: 'пазя', cyr: 'pazya' },
      { en: 'to learn', bg: 'уча', cyr: 'ucha' },
      { en: 'to teach', bg: 'преподавам', cyr: 'prepodavam' },
      { en: 'to forget', bg: 'забравям', cyr: 'zabravyam' },
      { en: 'to try', bg: 'опитвам', cyr: 'opitvam' },
    ],
  },
  {
    name: 'More Verbs',
    description: 'To call, send, bring + new, ugly',
    theme: 'essential',
    order: 254,
    words: [
      { en: 'to call', bg: 'обаждам се', cyr: 'obazhdam se' },
      { en: 'to send', bg: 'изпращам', cyr: 'izprashtam' },
      { en: 'to bring', bg: 'донасям', cyr: 'donasyam' },
      { en: 'new', bg: 'нов', cyr: 'nov' },
      { en: 'ugly', bg: 'грозен', cyr: 'grozen' },
    ],
  },
  {
    name: 'Describing Words I',
    description: 'Difficult, wrong, busy, early, late',
    theme: 'essential',
    order: 255,
    words: [
      { en: 'difficult', bg: 'труден', cyr: 'truden' },
      { en: 'wrong', bg: 'грешен', cyr: 'greshen' },
      { en: 'busy', bg: 'зает', cyr: 'zaet' },
      { en: 'early', bg: 'рано', cyr: 'rano' },
      { en: 'late', bg: 'късно', cyr: 'kasno' },
    ],
  },
  {
    name: 'Describing Words II',
    description: 'Full, empty, wet, dry, clean',
    theme: 'essential',
    order: 256,
    words: [
      { en: 'full', bg: 'пълен', cyr: 'palen' },
      { en: 'empty', bg: 'празен', cyr: 'prazen' },
      { en: 'wet', bg: 'мокър', cyr: 'mokar' },
      { en: 'dry', bg: 'сух', cyr: 'suh' },
      { en: 'clean', bg: 'чист', cyr: 'chist' },
    ],
  },
  {
    name: 'Describing Words III',
    description: 'Dirty, light, loud, quiet + because',
    theme: 'essential',
    order: 257,
    words: [
      { en: 'dirty', bg: 'мръсен', cyr: 'mrasen' },
      { en: 'light', bg: 'светъл', cyr: 'svetal' },
      { en: 'loud', bg: 'шумен', cyr: 'shumen' },
      { en: 'quiet', bg: 'тих', cyr: 'tih' },
      { en: 'because', bg: 'защото', cyr: 'zashtoto' },
    ],
  },
  {
    name: 'Connectors I',
    description: 'If, without, for, before, after',
    theme: 'essential',
    order: 258,
    words: [
      { en: 'if', bg: 'ако', cyr: 'ako' },
      { en: 'without', bg: 'без', cyr: 'bez' },
      { en: 'for', bg: 'за', cyr: 'za' },
      { en: 'before', bg: 'преди', cyr: 'predi' },
      { en: 'after', bg: 'след', cyr: 'sled' },
    ],
  },
  {
    name: 'Connectors II',
    description: 'During, until, at, above, between',
    theme: 'essential',
    order: 259,
    words: [
      { en: 'during', bg: 'през', cyr: 'prez' },
      { en: 'until', bg: 'до', cyr: 'do' },
      { en: 'at', bg: 'при', cyr: 'pri' },
      { en: 'above', bg: 'над', cyr: 'nad' },
      { en: 'between', bg: 'между', cyr: 'mezhdu' },
    ],
  },
  {
    name: 'Position & Time',
    description: 'Behind, sometimes, often, rarely, already',
    theme: 'essential',
    order: 260,
    words: [
      { en: 'behind', bg: 'зад', cyr: 'zad' },
      { en: 'sometimes', bg: 'понякога', cyr: 'ponyakoga' },
      { en: 'often', bg: 'често', cyr: 'chesto' },
      { en: 'rarely', bg: 'рядко', cyr: 'ryadko' },
      { en: 'already', bg: 'вече', cyr: 'veche' },
    ],
  },
  {
    name: 'Time & Numbers',
    description: 'Soon, later, inside, outside, zero',
    theme: 'essential',
    order: 261,
    words: [
      { en: 'soon', bg: 'скоро', cyr: 'skoro' },
      { en: 'later', bg: 'по-късно', cyr: 'po-kasno' },
      { en: 'inside', bg: 'вътре', cyr: 'vatre' },
      { en: 'outside', bg: 'навън', cyr: 'navan' },
      { en: 'zero', bg: 'нула', cyr: 'nula' },
    ],
  },
  {
    name: 'Numbers',
    description: 'Hundred, thousand, first, second, last',
    theme: 'essential',
    order: 262,
    words: [
      { en: 'hundred', bg: 'сто', cyr: 'sto' },
      { en: 'thousand', bg: 'хиляда', cyr: 'hilyada' },
      { en: 'first', bg: 'първи', cyr: 'parvi' },
      { en: 'second', bg: 'втори', cyr: 'vtori' },
      { en: 'last', bg: 'последен', cyr: 'posleden' },
    ],
  },
  {
    name: 'Quantity I',
    description: 'More, less, some, many, much',
    theme: 'essential',
    order: 263,
    words: [
      { en: 'more', bg: 'повече', cyr: 'poveche' },
      { en: 'less', bg: 'по-малко', cyr: 'po-malko' },
      { en: 'some', bg: 'няколко', cyr: 'nyakolko' },
      { en: 'many', bg: 'много', cyr: 'mnogo' },
      { en: 'much', bg: 'доста', cyr: 'dosta' },
    ],
  },
  {
    name: 'Quantity II',
    description: 'Few, all, every, each, both',
    theme: 'essential',
    order: 264,
    words: [
      { en: 'few', bg: 'малко', cyr: 'malko' },
      { en: 'all', bg: 'всичко', cyr: 'vsichko' },
      { en: 'every', bg: 'всеки', cyr: 'vseki' },
      { en: 'each', bg: 'всяко', cyr: 'vsyako' },
      { en: 'both', bg: 'двата', cyr: 'dvata' },
    ],
  },
  {
    name: 'Comparing',
    description: 'Other, another, same, different + pasta',
    theme: 'essential',
    order: 265,
    words: [
      { en: 'other', bg: 'друг', cyr: 'drug' },
      { en: 'another', bg: 'друга', cyr: 'druga' },
      { en: 'same', bg: 'същ', cyr: 'sasht' },
      { en: 'different', bg: 'различен', cyr: 'razlichen' },
      { en: 'pasta', bg: 'макарони', cyr: 'makaroni' },
    ],
  },
  {
    name: 'More Food',
    description: 'Pepper, oil, jam, cake, ice cream',
    theme: 'essential',
    order: 266,
    words: [
      { en: 'pepper', bg: 'пипер', cyr: 'piper' },
      { en: 'oil', bg: 'олио', cyr: 'olio' },
      { en: 'jam', bg: 'конфитюр', cyr: 'konfityur' },
      { en: 'cake', bg: 'торта', cyr: 'torta' },
      { en: 'ice cream', bg: 'сладолед', cyr: 'sladoled' },
    ],
  },
  {
    name: 'Places & Travel',
    description: 'Building, town, country, passport, luggage',
    theme: 'essential',
    order: 267,
    words: [
      { en: 'building', bg: 'сграда', cyr: 'sgrada' },
      { en: 'town', bg: 'градче', cyr: 'gradche' },
      { en: 'country', bg: 'държава', cyr: 'darzhava' },
      { en: 'passport', bg: 'паспорт', cyr: 'pasport' },
      { en: 'luggage', bg: 'багаж', cyr: 'bagazh' },
    ],
  },
  {
    name: 'Travel & Money',
    description: 'Plane, ship, cost, cash, account',
    theme: 'essential',
    order: 268,
    words: [
      { en: 'plane', bg: 'самолет', cyr: 'samolet' },
      { en: 'ship', bg: 'кораб', cyr: 'korab' },
      { en: 'cost', bg: 'разход', cyr: 'razhod' },
      { en: 'cash', bg: 'кеш', cyr: 'kesh' },
      { en: 'account', bg: 'банкова сметка', cyr: 'bankova smetka' },
    ],
  },
  {
    name: 'Money & Body',
    description: 'Spend, save, face, tooth, arm',
    theme: 'essential',
    order: 269,
    words: [
      { en: 'spend', bg: 'харча', cyr: 'harcha' },
      { en: 'save', bg: 'спестявам', cyr: 'spestyavam' },
      { en: 'face', bg: 'лице', cyr: 'litse' },
      { en: 'tooth', bg: 'зъб', cyr: 'zab' },
      { en: 'arm', bg: 'мишница', cyr: 'mishnitsa' },
    ],
  },
  {
    name: 'The Body',
    description: 'Foot, stomach, finger, flu, headache',
    theme: 'essential',
    order: 270,
    words: [
      { en: 'foot', bg: 'стъпало', cyr: 'stapalo' },
      { en: 'stomach', bg: 'стомах', cyr: 'stomah' },
      { en: 'finger', bg: 'пръстът', cyr: 'prastat' },
      { en: 'flu', bg: 'грип', cyr: 'grip' },
      { en: 'headache', bg: 'главоболие', cyr: 'glavobolie' },
    ],
  },
  {
    name: 'Health',
    description: 'Stomachache, dentist, healthy, sick, weak',
    theme: 'essential',
    order: 271,
    words: [
      { en: 'stomachache', bg: 'стомашна болка', cyr: 'stomashna bolka' },
      { en: 'dentist', bg: 'зъболекар', cyr: 'zabolekar' },
      { en: 'healthy', bg: 'здрав', cyr: 'zdrav' },
      { en: 'sick', bg: 'болен', cyr: 'bolen' },
      { en: 'weak', bg: 'слаб', cyr: 'slab' },
    ],
  },
  {
    name: 'Weather',
    description: 'Weather, temperature, degree, sunny, rainy',
    theme: 'essential',
    order: 272,
    words: [
      { en: 'weather', bg: 'времето', cyr: 'vremeto' },
      { en: 'temperature', bg: 'температура', cyr: 'temperatura' },
      { en: 'degree', bg: 'градус', cyr: 'gradus' },
      { en: 'sunny', bg: 'слънчев', cyr: 'slanchev' },
      { en: 'rainy', bg: 'дъждовен', cyr: 'dazhdoven' },
    ],
  },
  {
    name: 'Weather & Nature',
    description: 'Cloudy, windy, island, stone, shadow',
    theme: 'essential',
    order: 273,
    words: [
      { en: 'cloudy', bg: 'облачен', cyr: 'oblachen' },
      { en: 'windy', bg: 'ветровит', cyr: 'vetrovit' },
      { en: 'island', bg: 'остров', cyr: 'ostrov' },
      { en: 'stone', bg: 'камъкът', cyr: 'kamakat' },
      { en: 'shadow', bg: 'сянката', cyr: 'syankata' },
    ],
  },
  {
    name: 'Clothing & Home',
    description: 'Belt, watch, necklace, umbrella, drawer',
    theme: 'essential',
    order: 274,
    words: [
      { en: 'belt', bg: 'колан', cyr: 'kolan' },
      { en: 'watch', bg: 'ръчен часовник', cyr: 'rachen chasovnik' },
      { en: 'necklace', bg: 'колие', cyr: 'kolie' },
      { en: 'umbrella', bg: 'чадър', cyr: 'chadar' },
      { en: 'drawer', bg: 'чекмедже', cyr: 'chekmedzhe' },
    ],
  },
  {
    name: 'In the Home',
    description: 'Bowl, glass, pan, bath, sink',
    theme: 'essential',
    order: 275,
    words: [
      { en: 'bowl', bg: 'купа', cyr: 'kupa' },
      { en: 'glass', bg: 'стъкло', cyr: 'staklo' },
      { en: 'pan', bg: 'тиган', cyr: 'tigan' },
      { en: 'bath', bg: 'вана', cyr: 'vana' },
      { en: 'sink', bg: 'мивка', cyr: 'mivka' },
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
      SELECT "order" FROM heaps WHERE "order" >= 251 AND "order" <= 275 AND map_id = 12
    ` as { order: number }[]
    const existingOrderSet = new Set(existingOrders.map(r => r.order))

    const toInsert = MAP12_HEAPS.filter(h => !existingOrderSet.has(h.order))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Map 12 heaps already seeded', inserted: 0 })
    }

    const { inserted, skipped, skippedWords } = await insertHeapsDeduped(sql, toInsert, 12)

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} Map 12 heaps (${skipped} duplicate words skipped)`,
      inserted,
      skipped,
      skippedWords,
    })
  } catch (err) {
    console.error('Seed-map12 error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
