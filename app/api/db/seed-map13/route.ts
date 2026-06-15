import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { insertHeapsDeduped } from '@/lib/seed'

// Map 13 — "Daily Bulgarian": heaps 276–300, a third high-frequency batch focused
// on everyday speech (connectors, position, time adverbs, travel, shopping and
// communication verbs) plus a deliberate re-cover of the most common nouns/verbs
// from the thematic maps in distinct Bulgarian forms (definite article, perfective
// aspect, or natural synonyms) so they survive the global bg dedup. Uses the new
// 'frequency-vocab' theme → pink accent, the practical (non-scenic) look.
//
// NOTE: map_id 13 still needs to be registered in app/api/db/migrate/route.ts —
// it is inserted at order_index=2 (right after Beginners Bay) with maps 2-12 slid
// down one slot. Run migrate before this seed.
const MAP13_HEAPS = [
  {
    name: 'Vital Connectors',
    description: 'If, so, about, since, because',
    theme: 'frequency-vocab',
    order: 276,
    words: [
      { en: 'if', bg: 'дали', cyr: 'dali' },
      { en: 'so', bg: 'затова', cyr: 'zatova' },
      { en: 'about', bg: 'относно', cyr: 'otnosno' },
      { en: 'since', bg: 'откакто', cyr: 'otkakto' },
      { en: 'because', bg: 'понеже', cyr: 'ponezhe' },
    ],
  },
  {
    name: 'Position & Place',
    description: 'In front of, next to, above, below, behind',
    theme: 'frequency-vocab',
    order: 277,
    words: [
      { en: 'in front of', bg: 'пред', cyr: 'pred' },
      { en: 'next to', bg: 'редом с', cyr: 'redom s' },
      { en: 'above', bg: 'отгоре', cyr: 'otgore' },
      { en: 'below', bg: 'отдолу', cyr: 'otdolu' },
      { en: 'behind', bg: 'отзад', cyr: 'otzad' },
    ],
  },
  {
    name: 'Time Adverbs',
    description: 'Yet, still, just, already, soon',
    theme: 'frequency-vocab',
    order: 278,
    words: [
      { en: 'yet', bg: 'още', cyr: 'oshte' },
      { en: 'still', bg: 'все още', cyr: 'vse oshte' },
      { en: 'just', bg: 'току-що', cyr: 'toku-shto' },
      { en: 'already', bg: 'досега', cyr: 'dosega' },
      { en: 'soon', bg: 'след малко', cyr: 'sled malko' },
    ],
  },
  {
    name: 'Everywhere',
    description: 'Everywhere, somewhere, anywhere, nowhere, inside',
    theme: 'frequency-vocab',
    order: 279,
    words: [
      { en: 'everywhere', bg: 'навсякъде', cyr: 'navsyakade' },
      { en: 'somewhere', bg: 'някъде', cyr: 'nyakade' },
      { en: 'anywhere', bg: 'където и да е', cyr: 'kadeto i da e' },
      { en: 'nowhere', bg: 'никъде', cyr: 'nikade' },
      { en: 'inside', bg: 'отвътре', cyr: 'otvatre' },
    ],
  },
  {
    name: 'Travel: By Road',
    description: 'Bike, drive, ride, fuel, bridge',
    theme: 'frequency-vocab',
    order: 280,
    words: [
      { en: 'bike', bg: 'колело', cyr: 'kolelo' },
      { en: 'drive', bg: 'карам', cyr: 'karam' },
      { en: 'ride', bg: 'возя се', cyr: 'voza se' },
      { en: 'fuel', bg: 'гориво', cyr: 'gorivo' },
      { en: 'bridge', bg: 'мостът', cyr: 'mostat' },
    ],
  },
  {
    name: 'Shopping Verbs',
    description: 'To sell, to buy, to pay, to spend, to save',
    theme: 'frequency-vocab',
    order: 281,
    words: [
      { en: 'to sell', bg: 'продавам', cyr: 'prodavam' },
      { en: 'to buy', bg: 'купя', cyr: 'kupya' },
      { en: 'to pay', bg: 'платя', cyr: 'platya' },
      { en: 'to spend', bg: 'похарча', cyr: 'poharcha' },
      { en: 'to save', bg: 'спестя', cyr: 'spestya' },
    ],
  },
  {
    name: 'Communication',
    description: 'To talk, to tell, to ask, to answer, to explain',
    theme: 'frequency-vocab',
    order: 282,
    words: [
      { en: 'to talk', bg: 'приказвам', cyr: 'prikazvam' },
      { en: 'to tell', bg: 'разказвам', cyr: 'razkazvam' },
      { en: 'to ask', bg: 'попитам', cyr: 'popitam' },
      { en: 'to answer', bg: 'отговарям', cyr: 'otgovaryam' },
      { en: 'to explain', bg: 'обяснявам', cyr: 'obyasnyavam' },
    ],
  },
  {
    name: 'Nature Places',
    description: 'River, forest, mountain, sea, field',
    theme: 'frequency-vocab',
    order: 283,
    words: [
      { en: 'river', bg: 'реката', cyr: 'rekata' },
      { en: 'forest', bg: 'гората', cyr: 'gorata' },
      { en: 'mountain', bg: 'планината', cyr: 'planinata' },
      { en: 'sea', bg: 'морето', cyr: 'moreto' },
      { en: 'field', bg: 'полето', cyr: 'poleto' },
    ],
  },
  {
    name: 'Nature Elements',
    description: 'Sky, sun, moon, star, cloud',
    theme: 'frequency-vocab',
    order: 284,
    words: [
      { en: 'sky', bg: 'небето', cyr: 'nebeto' },
      { en: 'sun', bg: 'слънцето', cyr: 'slantseto' },
      { en: 'moon', bg: 'луната', cyr: 'lunata' },
      { en: 'star', bg: 'звездата', cyr: 'zvezdata' },
      { en: 'cloud', bg: 'облакът', cyr: 'oblakat' },
    ],
  },
  {
    name: 'Weather Conditions',
    description: 'Rain, snow, wind, storm, fog',
    theme: 'frequency-vocab',
    order: 285,
    words: [
      { en: 'rain', bg: 'дъждът', cyr: 'dazhdat' },
      { en: 'snow', bg: 'снегът', cyr: 'snegat' },
      { en: 'wind', bg: 'вятърът', cyr: 'vyatarat' },
      { en: 'storm', bg: 'бурята', cyr: 'buryata' },
      { en: 'fog', bg: 'мъглата', cyr: 'maglata' },
    ],
  },
  {
    name: 'Basic Body I',
    description: 'Head, eye, ear, nose, mouth',
    theme: 'frequency-vocab',
    order: 286,
    words: [
      { en: 'head', bg: 'главата', cyr: 'glavata' },
      { en: 'eye', bg: 'окото', cyr: 'okoto' },
      { en: 'ear', bg: 'ухото', cyr: 'uhoto' },
      { en: 'nose', bg: 'носът', cyr: 'nosat' },
      { en: 'mouth', bg: 'устата', cyr: 'ustata' },
    ],
  },
  {
    name: 'Basic Body II',
    description: 'Hand, leg, foot, back, knee',
    theme: 'frequency-vocab',
    order: 287,
    words: [
      { en: 'hand', bg: 'ръката', cyr: 'rakata' },
      { en: 'leg', bg: 'кракът', cyr: 'krakat' },
      { en: 'foot', bg: 'стъпалото', cyr: 'stapaloto' },
      { en: 'back', bg: 'гърбът', cyr: 'garbat' },
      { en: 'knee', bg: 'коляното', cyr: 'kolyanoto' },
    ],
  },
  {
    name: 'Home Furniture',
    description: 'Table, chair, bed, door, window',
    theme: 'frequency-vocab',
    order: 288,
    words: [
      { en: 'table', bg: 'масата', cyr: 'masata' },
      { en: 'chair', bg: 'столът', cyr: 'stolat' },
      { en: 'bed', bg: 'леглото', cyr: 'legloto' },
      { en: 'door', bg: 'вратата', cyr: 'vratata' },
      { en: 'window', bg: 'прозорецът', cyr: 'prozoretsat' },
    ],
  },
  {
    name: 'Kitchen Items',
    description: 'Cup, plate, knife, fork, spoon',
    theme: 'frequency-vocab',
    order: 289,
    words: [
      { en: 'cup', bg: 'чашата', cyr: 'chashata' },
      { en: 'plate', bg: 'чинията', cyr: 'chiniyata' },
      { en: 'knife', bg: 'ножът', cyr: 'nozhat' },
      { en: 'fork', bg: 'вилицата', cyr: 'vilitsata' },
      { en: 'spoon', bg: 'лъжицата', cyr: 'lazhitsata' },
    ],
  },
  {
    name: 'Food Staples',
    description: 'Bread, milk, cheese, butter, honey',
    theme: 'frequency-vocab',
    order: 290,
    words: [
      { en: 'bread', bg: 'хлябът', cyr: 'hlyabat' },
      { en: 'milk', bg: 'млякото', cyr: 'mlyakoto' },
      { en: 'cheese', bg: 'сиренето', cyr: 'sireneto' },
      { en: 'butter', bg: 'маслото', cyr: 'masloto' },
      { en: 'honey', bg: 'медът', cyr: 'medat' },
    ],
  },
  {
    name: 'Drinks',
    description: 'Water, coffee, tea, beer, wine',
    theme: 'frequency-vocab',
    order: 291,
    words: [
      { en: 'water', bg: 'водата', cyr: 'vodata' },
      { en: 'coffee', bg: 'кафето', cyr: 'kafeto' },
      { en: 'tea', bg: 'чаят', cyr: 'chayat' },
      { en: 'beer', bg: 'бирата', cyr: 'birata' },
      { en: 'wine', bg: 'виното', cyr: 'vinoto' },
    ],
  },
  {
    name: 'Fruits',
    description: 'Apple, banana, orange, juice, sugar',
    theme: 'frequency-vocab',
    order: 292,
    words: [
      { en: 'apple', bg: 'ябълката', cyr: 'yabalkata' },
      { en: 'banana', bg: 'бананът', cyr: 'bananat' },
      { en: 'orange', bg: 'портокалът', cyr: 'portokalat' },
      { en: 'juice', bg: 'сокът', cyr: 'sokat' },
      { en: 'sugar', bg: 'захарта', cyr: 'zaharta' },
    ],
  },
  {
    name: 'Clothing',
    description: 'Shirt, pants, jacket, hat, shoe',
    theme: 'frequency-vocab',
    order: 293,
    words: [
      { en: 'shirt', bg: 'ризата', cyr: 'rizata' },
      { en: 'pants', bg: 'панталонът', cyr: 'pantalonat' },
      { en: 'jacket', bg: 'якето', cyr: 'yaketo' },
      { en: 'hat', bg: 'шапката', cyr: 'shapkata' },
      { en: 'shoe', bg: 'обувката', cyr: 'obuvkata' },
    ],
  },
  {
    name: 'Family',
    description: 'Mother, father, brother, sister, friend',
    theme: 'frequency-vocab',
    order: 294,
    words: [
      { en: 'mother', bg: 'майката', cyr: 'maykata' },
      { en: 'father', bg: 'бащата', cyr: 'bashtata' },
      { en: 'brother', bg: 'братът', cyr: 'bratat' },
      { en: 'sister', bg: 'сестрата', cyr: 'sestrata' },
      { en: 'friend', bg: 'приятелят', cyr: 'priyatelyat' },
    ],
  },
  {
    name: 'People',
    description: 'Man, woman, child, baby, person',
    theme: 'frequency-vocab',
    order: 295,
    words: [
      { en: 'man', bg: 'мъжът', cyr: 'mazhat' },
      { en: 'woman', bg: 'жената', cyr: 'zhenata' },
      { en: 'child', bg: 'детето', cyr: 'deteto' },
      { en: 'baby', bg: 'бебето', cyr: 'bebeto' },
      { en: 'person', bg: 'човекът', cyr: 'chovekat' },
    ],
  },
  {
    name: 'Time Words',
    description: 'Today, yesterday, tomorrow, morning, evening',
    theme: 'frequency-vocab',
    order: 296,
    words: [
      { en: 'today', bg: 'днеска', cyr: 'dneska' },
      { en: 'yesterday', bg: 'снощи', cyr: 'snoshti' },
      { en: 'tomorrow', bg: 'следващият ден', cyr: 'sledvashtiyat den' },
      { en: 'morning', bg: 'сутринта', cyr: 'sutrinta' },
      { en: 'evening', bg: 'вечерта', cyr: 'vecherta' },
    ],
  },
  {
    name: 'Transports',
    description: 'Car, bus, train, taxi, bike',
    theme: 'frequency-vocab',
    order: 297,
    words: [
      { en: 'car', bg: 'колата', cyr: 'kolata' },
      { en: 'bus', bg: 'автобусът', cyr: 'avtobusat' },
      { en: 'train', bg: 'влакът', cyr: 'vlakat' },
      { en: 'taxi', bg: 'таксито', cyr: 'taksito' },
      { en: 'bike', bg: 'велосипедът', cyr: 'velosipedat' },
    ],
  },
  {
    name: 'Core Verbs I',
    description: 'To eat, to drink, to sleep, to come, to go',
    theme: 'frequency-vocab',
    order: 298,
    words: [
      { en: 'to eat', bg: 'изям', cyr: 'izyam' },
      { en: 'to drink', bg: 'изпия', cyr: 'izpiya' },
      { en: 'to sleep', bg: 'заспя', cyr: 'zaspya' },
      { en: 'to come', bg: 'дойда', cyr: 'doyda' },
      { en: 'to go', bg: 'отида', cyr: 'otida' },
    ],
  },
  {
    name: 'Core Verbs II',
    description: 'To read, to write, to work, to speak, to cook',
    theme: 'frequency-vocab',
    order: 299,
    words: [
      { en: 'to read', bg: 'прочета', cyr: 'procheta' },
      { en: 'to write', bg: 'напиша', cyr: 'napisha' },
      { en: 'to work', bg: 'трудя се', cyr: 'trudya se' },
      { en: 'to speak', bg: 'разговарям', cyr: 'razgovaryam' },
      { en: 'to cook', bg: 'сготвя', cyr: 'sgotvya' },
    ],
  },
  {
    name: 'Core Verbs III',
    description: 'To run, to walk, to sit, to stand, to find',
    theme: 'frequency-vocab',
    order: 300,
    words: [
      { en: 'to run', bg: 'бягам', cyr: 'byagam' },
      { en: 'to walk', bg: 'вървя', cyr: 'varvya' },
      { en: 'to sit', bg: 'седна', cyr: 'sedna' },
      { en: 'to stand', bg: 'стана', cyr: 'stana' },
      { en: 'to find', bg: 'намеря', cyr: 'namerya' },
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
      SELECT "order" FROM heaps WHERE "order" >= 276 AND "order" <= 300 AND map_id = 13
    ` as { order: number }[]
    const existingOrderSet = new Set(existingOrders.map(r => r.order))

    const toInsert = MAP13_HEAPS.filter(h => !existingOrderSet.has(h.order))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Map 13 heaps already seeded', inserted: 0 })
    }

    const { inserted, skipped, skippedWords } = await insertHeapsDeduped(sql, toInsert, 13)

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} Map 13 heaps (${skipped} duplicate words skipped)`,
      inserted,
      skipped,
      skippedWords,
    })
  } catch (err) {
    console.error('Seed-map13 error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
