import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { insertHeapsDeduped } from '@/lib/seed'

// Map 3 — "Out & About": heaps 51–75, practical themed vocab — restaurants, travel, technology, leisure, business and going out.
const MAP3_HEAPS = [
  {
    name: 'Restaurant: Ordering',
    description: 'Order like a local (поръчване)',
    theme: 'Restaurant',
    order: 51,
    words: [
      { en: 'menu', bg: 'меню', cyr: 'menyu' },
      { en: 'waiter', bg: 'сервитьор', cyr: 'servityor' },
      { en: 'order', bg: 'поръчка', cyr: 'porachka' },
      { en: 'bill', bg: 'сметка', cyr: 'smetka' },
      { en: 'reservation', bg: 'резервация', cyr: 'rezervatsiya' },
    ],
  },
  {
    name: 'Restaurant: Food',
    description: 'Dishes on the Bulgarian table (храна)',
    theme: 'Restaurant',
    order: 52,
    words: [
      { en: 'soup', bg: 'супа', cyr: 'supa' },
      { en: 'salad', bg: 'салата', cyr: 'salata' },
      { en: 'meat', bg: 'месо', cyr: 'meso' },
      { en: 'dessert', bg: 'десерт', cyr: 'desert' },
      { en: 'dish', bg: 'ястие', cyr: 'yastie' },
    ],
  },
  {
    name: 'Celebration: Party',
    description: 'Throw a Bulgarian party (парти)',
    theme: 'Celebration',
    order: 53,
    words: [
      { en: 'party', bg: 'парти', cyr: 'parti' },
      { en: 'balloon', bg: 'балон', cyr: 'balon' },
      { en: 'dance', bg: 'танц', cyr: 'tants' },
      { en: 'toast', bg: 'наздравица', cyr: 'nazdravitsa' },
      { en: 'fireworks', bg: 'фойерверки', cyr: 'foyerverki' },
    ],
  },
  {
    name: 'Celebration: Gifts',
    description: 'Give and receive in Bulgarian (подаръци)',
    theme: 'Celebration',
    order: 54,
    words: [
      { en: 'surprise', bg: 'изненада', cyr: 'iznenada' },
      { en: 'ribbon', bg: 'панделка', cyr: 'pandelka' },
      { en: 'greeting card', bg: 'картичка', cyr: 'kartichka' },
      { en: 'flowers', bg: 'цветя', cyr: 'tsvetya' },
      { en: 'invitation', bg: 'покана', cyr: 'pokana' },
    ],
  },
  {
    name: 'Travel: Hotel',
    description: 'Check in to a Bulgarian hotel (хотел)',
    theme: 'Travel',
    order: 55,
    words: [
      { en: 'hotel', bg: 'хотел', cyr: 'hotel' },
      { en: 'room', bg: 'стая', cyr: 'staya' },
      { en: 'key', bg: 'ключ', cyr: 'klyuch' },
      { en: 'bed', bg: 'легло', cyr: 'leglo' },
      { en: 'reception', bg: 'рецепция', cyr: 'retseptsiya' },
    ],
  },
  {
    name: 'Travel: Directions',
    description: 'Find your way in Bulgarian (упътвания)',
    theme: 'Travel',
    order: 56,
    words: [
      { en: 'left', bg: 'ляво', cyr: 'lyavo' },
      { en: 'right', bg: 'дясно', cyr: 'dyasno' },
      { en: 'straight', bg: 'направо', cyr: 'napravo' },
      { en: 'near', bg: 'близо', cyr: 'blizo' },
      { en: 'far', bg: 'далеч', cyr: 'dalech' },
    ],
  },
  {
    name: 'Technology: Phone',
    description: 'Your Bulgarian smartphone (телефон)',
    theme: 'Technology',
    order: 57,
    words: [
      { en: 'phone', bg: 'телефон', cyr: 'telefon' },
      { en: 'screen', bg: 'екран', cyr: 'ekran' },
      { en: 'battery', bg: 'батерия', cyr: 'bateriya' },
      { en: 'charger', bg: 'зарядно', cyr: 'zaryadno' },
      { en: 'call', bg: 'обаждане', cyr: 'obazhdane' },
    ],
  },
  {
    name: 'Technology: Computer',
    description: 'Parts of the Bulgarian computer (компютър)',
    theme: 'Technology',
    order: 58,
    words: [
      { en: 'keyboard', bg: 'клавиатура', cyr: 'klaviatura' },
      { en: 'mouse', bg: 'мишка', cyr: 'mishka' },
      { en: 'file', bg: 'файл', cyr: 'fayl' },
      { en: 'folder', bg: 'папка', cyr: 'papka' },
      { en: 'program', bg: 'програма', cyr: 'programa' },
    ],
  },
  {
    name: 'Technology: Internet',
    description: 'Get online in Bulgarian (интернет)',
    theme: 'Technology',
    order: 59,
    words: [
      { en: 'internet', bg: 'интернет', cyr: 'internet' },
      { en: 'website', bg: 'уебсайт', cyr: 'uebsayt' },
      { en: 'password', bg: 'парола', cyr: 'parola' },
      { en: 'network', bg: 'мрежа', cyr: 'mrezha' },
      { en: 'search', bg: 'търсене', cyr: 'tarsene' },
    ],
  },
  {
    name: 'Nature: Plants',
    description: 'Green and growing in Bulgarian (растения)',
    theme: 'Nature',
    order: 60,
    words: [
      { en: 'plant', bg: 'растение', cyr: 'rastenie' },
      { en: 'tree', bg: 'дърво', cyr: 'darvo' },
      { en: 'flower', bg: 'цвете', cyr: 'tsvete' },
      { en: 'grass', bg: 'трева', cyr: 'treva' },
      { en: 'leaf', bg: 'лист', cyr: 'list' },
    ],
  },
  {
    name: 'Nature: Sea',
    description: 'Along the Bulgarian coast (море)',
    theme: 'Nature',
    order: 61,
    words: [
      { en: 'sea', bg: 'море', cyr: 'more' },
      { en: 'wave', bg: 'вълна', cyr: 'valna' },
      { en: 'beach', bg: 'плаж', cyr: 'plazh' },
      { en: 'sand', bg: 'пясък', cyr: 'pyasak' },
      { en: 'shell', bg: 'мида', cyr: 'mida' },
    ],
  },
  {
    name: 'Weather: Seasons',
    description: 'The Bulgarian year turns (сезони)',
    theme: 'Weather',
    order: 62,
    words: [
      { en: 'spring', bg: 'пролет', cyr: 'prolet' },
      { en: 'summer', bg: 'лято', cyr: 'lyato' },
      { en: 'autumn', bg: 'есен', cyr: 'esen' },
      { en: 'winter', bg: 'зима', cyr: 'zima' },
      { en: 'season', bg: 'сезон', cyr: 'sezon' },
    ],
  },
  {
    name: 'Calendar: Months',
    description: 'Months of the Bulgarian year (месеци)',
    theme: 'Calendar',
    order: 63,
    words: [
      { en: 'month', bg: 'месец', cyr: 'mesets' },
      { en: 'January', bg: 'януари', cyr: 'yanuari' },
      { en: 'February', bg: 'февруари', cyr: 'fevruari' },
      { en: 'March', bg: 'март', cyr: 'mart' },
      { en: 'year', bg: 'година', cyr: 'godina' },
    ],
  },
  {
    name: 'Calendar: Dates',
    description: 'Talk about time in Bulgarian (дати)',
    theme: 'Calendar',
    order: 64,
    words: [
      { en: 'today', bg: 'днес', cyr: 'dnes' },
      { en: 'tomorrow', bg: 'утре', cyr: 'utre' },
      { en: 'yesterday', bg: 'вчера', cyr: 'vchera' },
      { en: 'week', bg: 'седмица', cyr: 'sedmitsa' },
      { en: 'day', bg: 'ден', cyr: 'den' },
    ],
  },
  {
    name: 'Emergency: Hospital',
    description: 'When you need care in Bulgarian (болница)',
    theme: 'Emergency',
    order: 65,
    words: [
      { en: 'hospital', bg: 'болница', cyr: 'bolnitsa' },
      { en: 'ambulance', bg: 'линейка', cyr: 'lineyka' },
      { en: 'emergency', bg: 'спешност', cyr: 'speshnost' },
      { en: 'injury', bg: 'нараняване', cyr: 'naranyavane' },
      { en: 'accident', bg: 'злополука', cyr: 'zlopoluka' },
    ],
  },
  {
    name: 'Emergency: Police',
    description: 'Stay safe in Bulgarian (полиция)',
    theme: 'Emergency',
    order: 66,
    words: [
      { en: 'police', bg: 'полиция', cyr: 'politsiya' },
      { en: 'thief', bg: 'крадец', cyr: 'kradets' },
      { en: 'danger', bg: 'опасност', cyr: 'opasnost' },
      { en: 'help', bg: 'помощ', cyr: 'pomosht' },
      { en: 'law', bg: 'закон', cyr: 'zakon' },
    ],
  },
  {
    name: 'Home: Garden',
    description: 'Out in the Bulgarian garden (градина)',
    theme: 'Home',
    order: 67,
    words: [
      { en: 'garden', bg: 'градина', cyr: 'gradina' },
      { en: 'fence', bg: 'ограда', cyr: 'ograda' },
      { en: 'gate', bg: 'порта', cyr: 'porta' },
      { en: 'soil', bg: 'почва', cyr: 'pochva' },
      { en: 'seed', bg: 'семе', cyr: 'seme' },
    ],
  },
  {
    name: 'Leisure: Cinema',
    description: 'A night at the Bulgarian movies (кино)',
    theme: 'Leisure',
    order: 68,
    words: [
      { en: 'cinema', bg: 'кино', cyr: 'kino' },
      { en: 'film', bg: 'филм', cyr: 'film' },
      { en: 'ticket', bg: 'билет', cyr: 'bilet' },
      { en: 'actor', bg: 'актьор', cyr: 'aktyor' },
      { en: 'popcorn', bg: 'пуканки', cyr: 'pukanki' },
    ],
  },
  {
    name: 'Leisure: Park',
    description: 'A walk in the Bulgarian park (парк)',
    theme: 'Leisure',
    order: 69,
    words: [
      { en: 'park', bg: 'парк', cyr: 'park' },
      { en: 'bench', bg: 'пейка', cyr: 'peyka' },
      { en: 'fountain', bg: 'фонтан', cyr: 'fontan' },
      { en: 'path', bg: 'пътека', cyr: 'pateka' },
      { en: 'playground', bg: 'детска площадка', cyr: 'detska ploshtadka' },
    ],
  },
  {
    name: 'Business: Money',
    description: 'Handle money in Bulgarian (пари)',
    theme: 'Business',
    order: 70,
    words: [
      { en: 'coin', bg: 'монета', cyr: 'moneta' },
      { en: 'banknote', bg: 'банкнота', cyr: 'banknota' },
      { en: 'bank', bg: 'банка', cyr: 'banka' },
      { en: 'card', bg: 'карта', cyr: 'karta' },
      { en: 'salary', bg: 'заплата', cyr: 'zaplata' },
    ],
  },
  {
    name: 'Business: Trade',
    description: 'Buying and selling in Bulgarian (търговия)',
    theme: 'Business',
    order: 71,
    words: [
      { en: 'trade', bg: 'търговия', cyr: 'targoviya' },
      { en: 'buyer', bg: 'купувач', cyr: 'kupuvach' },
      { en: 'seller', bg: 'продавач', cyr: 'prodavach' },
      { en: 'product', bg: 'продукт', cyr: 'produkt' },
      { en: 'profit', bg: 'печалба', cyr: 'pechalba' },
    ],
  },
  {
    name: 'People: Descriptions',
    description: 'Describe people in Bulgarian (описания)',
    theme: 'People',
    order: 72,
    words: [
      { en: 'tall', bg: 'висок', cyr: 'visok' },
      { en: 'short', bg: 'нисък', cyr: 'nisak' },
      { en: 'young', bg: 'млад', cyr: 'mlad' },
      { en: 'old', bg: 'стар', cyr: 'star' },
      { en: 'beautiful', bg: 'красив', cyr: 'krasiv' },
    ],
  },
  {
    name: 'People: Professions',
    description: 'Jobs and trades in Bulgarian (професии)',
    theme: 'People',
    order: 73,
    words: [
      { en: 'engineer', bg: 'инженер', cyr: 'inzhener' },
      { en: 'lawyer', bg: 'адвокат', cyr: 'advokat' },
      { en: 'cook', bg: 'готвач', cyr: 'gotvach' },
      { en: 'driver', bg: 'шофьор', cyr: 'shofyor' },
      { en: 'farmer', bg: 'фермер', cyr: 'fermer' },
    ],
  },
  {
    name: 'Life: Daily Routines',
    description: 'Everyday verbs in Bulgarian (ежедневие)',
    theme: 'Life',
    order: 74,
    words: [
      { en: 'to sleep', bg: 'спя', cyr: 'spya' },
      { en: 'to eat', bg: 'ям', cyr: 'yam' },
      { en: 'to work', bg: 'работя', cyr: 'rabotya' },
      { en: 'to rest', bg: 'почивам', cyr: 'pochivam' },
      { en: 'to wash', bg: 'мия', cyr: 'miya' },
    ],
  },
  {
    name: 'Life: Future Plans',
    description: 'Dreams and goals in Bulgarian (планове)',
    theme: 'Life',
    order: 75,
    words: [
      { en: 'plan', bg: 'план', cyr: 'plan' },
      { en: 'dream', bg: 'мечта', cyr: 'mechta' },
      { en: 'goal', bg: 'цел', cyr: 'tsel' },
      { en: 'future', bg: 'бъдеще', cyr: 'badeshte' },
      { en: 'hope', bg: 'надежда', cyr: 'nadezhda' },
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
      SELECT "order" FROM heaps WHERE "order" >= 51
    ` as { order: number }[]
    const existingOrderSet = new Set(existingOrders.map(r => r.order))

    const toInsert = MAP3_HEAPS.filter(h => !existingOrderSet.has(h.order))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Map 3 heaps already seeded', inserted: 0 })
    }

    const { inserted, skipped, skippedWords } = await insertHeapsDeduped(sql, toInsert, 3)

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} Map 3 heaps (${skipped} duplicate words skipped)`,
      inserted,
      skipped,
      skippedWords,
    })
  } catch (err) {
    console.error('Seed-map3 error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
