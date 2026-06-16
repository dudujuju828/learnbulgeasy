import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { insertHeapsDeduped } from '@/lib/seed'

// Map 14 — "Modern Life": heaps 301–325, frequency-vocab for modern everyday living
// (kitchen appliances & tools, electronics, transport, education, action verbs,
// emotions, meals, house parts, jobs, clothing). Uses the 'frequency-vocab' theme
// → pink accent, the practical (non-scenic) look.
//
// NOTE: map_id 14 still needs to be registered in app/api/db/migrate/route.ts.
// Run migrate before this seed.
const MAP14_HEAPS = [
  {
    name: 'Kitchen Appliances I',
    description: 'Oven, microwave, refrigerator, freezer, toaster',
    theme: 'frequency-vocab',
    order: 301,
    words: [
      { en: 'oven', bg: 'фурна', cyr: 'furna' },
      { en: 'microwave', bg: 'микровълнова', cyr: 'mikrovalnova' },
      { en: 'refrigerator', bg: 'хладилник', cyr: 'hladilnik' },
      { en: 'freezer', bg: 'фризер', cyr: 'frizer' },
      { en: 'toaster', bg: 'тостер', cyr: 'toster' }
    ],
  },
  {
    name: 'Kitchen Appliances II',
    description: 'Kettle, frying pan, saucepan, cutting board, colander',
    theme: 'frequency-vocab',
    order: 302,
    words: [
      { en: 'kettle', bg: 'чайник', cyr: 'chaynik' },
      { en: 'frying pan', bg: 'тиган', cyr: 'tigan' },
      { en: 'saucepan', bg: 'тенджера', cyr: 'tendzhera' },
      { en: 'cutting board', bg: 'дъска за рязане', cyr: 'daska za ryazane' },
      { en: 'colander', bg: 'цедка', cyr: 'tsedka' }
    ],
  },
  {
    name: 'Kitchen Tools',
    description: 'Grater, peeler, ladle, rolling pin, measuring cup',
    theme: 'frequency-vocab',
    order: 303,
    words: [
      { en: 'grater', bg: 'ренде', cyr: 'rende' },
      { en: 'peeler', bg: 'белачка', cyr: 'belachka' },
      { en: 'ladle', bg: 'черпак', cyr: 'cherpak' },
      { en: 'rolling pin', bg: 'точилка', cyr: 'tochilka' },
      { en: 'measuring cup', bg: 'мерителна чаша', cyr: 'meritelna chasha' }
    ],
  },
  {
    name: 'Stationery',
    description: 'Paper, eraser, ruler, textbook, dictionary',
    theme: 'frequency-vocab',
    order: 304,
    words: [
      { en: 'paper', bg: 'хартия', cyr: 'hartiya' },
      { en: 'eraser', bg: 'гума', cyr: 'guma' },
      { en: 'ruler', bg: 'линийка', cyr: 'liniyka' },
      { en: 'textbook', bg: 'учебник', cyr: 'uchebnik' },
      { en: 'dictionary', bg: 'речник', cyr: 'rechnik' }
    ],
  },
  {
    name: 'Electronics I',
    description: 'Television, tv, radio, laptop, tablet',
    theme: 'frequency-vocab',
    order: 305,
    words: [
      { en: 'television', bg: 'телевизия', cyr: 'televiziya' },
      { en: 'tv', bg: 'телевизор', cyr: 'televizor' },
      { en: 'radio', bg: 'радио', cyr: 'radio' },
      { en: 'laptop', bg: 'лаптоп', cyr: 'laptop' },
      { en: 'tablet', bg: 'таблет', cyr: 'tablet' }
    ],
  },
  {
    name: 'Electronics II',
    description: 'Headphones, speaker, camera, remote, charger',
    theme: 'frequency-vocab',
    order: 306,
    words: [
      { en: 'headphones', bg: 'слушалки', cyr: 'slushalki' },
      { en: 'speaker', bg: 'високоговорител', cyr: 'visokogovoritel' },
      { en: 'camera', bg: 'камера', cyr: 'kamera' },
      { en: 'remote', bg: 'дистанционно', cyr: 'distantsionno' },
      { en: 'charger', bg: 'зарядно', cyr: 'zaryadno' }
    ],
  },
  {
    name: 'On the Road',
    description: 'Train station, bus stop, highway, crosswalk, traffic light',
    theme: 'frequency-vocab',
    order: 307,
    words: [
      { en: 'train station', bg: 'жп гара', cyr: 'zhp gara' },
      { en: 'bus stop', bg: 'автобусна спирка', cyr: 'avtobusna spirka' },
      { en: 'highway', bg: 'магистрала', cyr: 'magistrala' },
      { en: 'crosswalk', bg: 'пешеходна пътека', cyr: 'peshehodna pateka' },
      { en: 'traffic light', bg: 'светофар', cyr: 'svetofar' }
    ],
  },
  {
    name: 'Garage & Trades',
    description: 'Parking, garage, pilot, mechanic, electrician',
    theme: 'frequency-vocab',
    order: 308,
    words: [
      { en: 'parking', bg: 'паркинг', cyr: 'parking' },
      { en: 'garage', bg: 'гараж', cyr: 'garazh' },
      { en: 'pilot', bg: 'пилот', cyr: 'pilot' },
      { en: 'mechanic', bg: 'механик', cyr: 'mehanik' },
      { en: 'electrician', bg: 'електротехник', cyr: 'elektrotehnik' }
    ],
  },
  {
    name: 'At University',
    description: 'Pencil, university, college, homework, exam',
    theme: 'frequency-vocab',
    order: 309,
    words: [
      { en: 'pencil', bg: 'молив', cyr: 'moliv' },
      { en: 'university', bg: 'университет', cyr: 'universitet' },
      { en: 'college', bg: 'колеж', cyr: 'kolezh' },
      { en: 'homework', bg: 'домашна работа', cyr: 'domashna rabota' },
      { en: 'exam', bg: 'изпит', cyr: 'izpit' }
    ],
  },
  {
    name: 'In the Classroom',
    description: 'Test, lesson, exercise, classroom, textbook',
    theme: 'frequency-vocab',
    order: 310,
    words: [
      { en: 'test', bg: 'тест', cyr: 'test' },
      { en: 'lesson', bg: 'урок', cyr: 'urok' },
      { en: 'exercise', bg: 'упражнение', cyr: 'uprazhnenie' },
      { en: 'classroom', bg: 'класна стая', cyr: 'klasna staya' },
      { en: 'textbook', bg: 'учебник', cyr: 'uchebnik' }
    ],
  },
  {
    name: 'Motion Verbs',
    description: 'To arrive, to leave, to finish, to start, to change',
    theme: 'frequency-vocab',
    order: 311,
    words: [
      { en: 'to arrive', bg: 'пристигам', cyr: 'pristigam' },
      { en: 'to leave', bg: 'тръгвам', cyr: 'tragvam' },
      { en: 'to finish', bg: 'завършвам', cyr: 'zavarshvam' },
      { en: 'to start', bg: 'започвам', cyr: 'zapochvam' },
      { en: 'to change', bg: 'променям', cyr: 'promenyam' }
    ],
  },
  {
    name: 'Decision Verbs',
    description: 'To choose, to decide, to believe, to hope, to thank',
    theme: 'frequency-vocab',
    order: 312,
    words: [
      { en: 'to choose', bg: 'избирам', cyr: 'izbiram' },
      { en: 'to decide', bg: 'решавам', cyr: 'reshavam' },
      { en: 'to believe', bg: 'вярвам', cyr: 'vyarvam' },
      { en: 'to hope', bg: 'надявам се', cyr: 'nadyavam se' },
      { en: 'to thank', bg: 'благодаря', cyr: 'blagodarya' }
    ],
  },
  {
    name: 'Social Verbs I',
    description: 'To apologize, to invite, to accept, to refuse, to allow',
    theme: 'frequency-vocab',
    order: 313,
    words: [
      { en: 'to apologize', bg: 'извинявам се', cyr: 'izvinyavam se' },
      { en: 'to invite', bg: 'каня', cyr: 'kanya' },
      { en: 'to accept', bg: 'приемам', cyr: 'priemam' },
      { en: 'to refuse', bg: 'отказвам', cyr: 'otkazvam' },
      { en: 'to allow', bg: 'позволявам', cyr: 'pozvolyavam' }
    ],
  },
  {
    name: 'Social Verbs II',
    description: 'To forbid, to help, to be able, to must, to wash',
    theme: 'frequency-vocab',
    order: 314,
    words: [
      { en: 'to forbid', bg: 'забранявам', cyr: 'zabranyavam' },
      { en: 'to help', bg: 'помагам', cyr: 'pomagam' },
      { en: 'to can (be able)', bg: 'мога', cyr: 'moga' },
      { en: 'to must', bg: 'трябва', cyr: 'tryabva' },
      { en: 'to wash', bg: 'мия', cyr: 'miya' }
    ],
  },
  {
    name: 'Emotions I',
    description: 'Nervous, bored, jealous, ashamed, grateful',
    theme: 'frequency-vocab',
    order: 315,
    words: [
      { en: 'nervous', bg: 'нервен', cyr: 'nerven' },
      { en: 'bored', bg: 'отегчен', cyr: 'otegchen' },
      { en: 'jealous', bg: 'ревнив', cyr: 'revniv' },
      { en: 'ashamed', bg: 'засрамен', cyr: 'zasramen' },
      { en: 'grateful', bg: 'благодарен', cyr: 'blagodaren' }
    ],
  },
  {
    name: 'Emotions II',
    description: 'Worried, confused, toddler, teenager, adult',
    theme: 'frequency-vocab',
    order: 316,
    words: [
      { en: 'worried', bg: 'притеснен', cyr: 'pritesnen' },
      { en: 'confused', bg: 'объркан', cyr: 'obarkan' },
      { en: 'toddler', bg: 'малко дете', cyr: 'malko dete' },
      { en: 'teenager', bg: 'тийнейджър', cyr: 'tineydzhar' },
      { en: 'adult', bg: 'възрастен', cyr: 'vazrasten' }
    ],
  },
  {
    name: 'Meals',
    description: 'Breakfast, lunch, dinner, snack, meal',
    theme: 'frequency-vocab',
    order: 317,
    words: [
      { en: 'breakfast', bg: 'закуска', cyr: 'zakuska' },
      { en: 'lunch', bg: 'обяд', cyr: 'obyad' },
      { en: 'dinner', bg: 'вечеря', cyr: 'vecherya' },
      { en: 'snack', bg: 'снакс', cyr: 'snaks' },
      { en: 'meal', bg: 'ястие', cyr: 'yastie' }
    ],
  },
  {
    name: 'Time Off',
    description: 'Appetizer, vacation, weekday, break, problem',
    theme: 'frequency-vocab',
    order: 318,
    words: [
      { en: 'appetizer', bg: 'предястие', cyr: 'predyastie' },
      { en: 'vacation', bg: 'ваканция', cyr: 'vakantsiya' },
      { en: 'weekday', bg: 'делничен ден', cyr: 'delnichen den' },
      { en: 'break', bg: 'почивка', cyr: 'pochivka' },
      { en: 'problem', bg: 'проблем', cyr: 'problem' }
    ],
  },
  {
    name: 'House Parts I',
    description: 'Upstairs, downstairs, basement, attic, hallway',
    theme: 'frequency-vocab',
    order: 319,
    words: [
      { en: 'upstairs', bg: 'горе', cyr: 'gore' },
      { en: 'downstairs', bg: 'долу', cyr: 'dolu' },
      { en: 'basement', bg: 'мазе', cyr: 'maze' },
      { en: 'attic', bg: 'таван', cyr: 'tavan' },
      { en: 'hallway', bg: 'коридор', cyr: 'koridor' }
    ],
  },
  {
    name: 'House Parts II',
    description: 'Stairs, balcony, neighbor, nearby, around',
    theme: 'frequency-vocab',
    order: 320,
    words: [
      { en: 'stairs', bg: 'стълби', cyr: 'stalbi' },
      { en: 'balcony', bg: 'балкон', cyr: 'balkon' },
      { en: 'neighbor', bg: 'съсед', cyr: 'sased' },
      { en: 'nearby', bg: 'наблизо', cyr: 'nablizo' },
      { en: 'around', bg: 'наоколо', cyr: 'naokolo' }
    ],
  },
  {
    name: 'Jobs I',
    description: 'Firefighter, scientist, artist, writer, plumber',
    theme: 'frequency-vocab',
    order: 321,
    words: [
      { en: 'firefighter', bg: 'пожарникар', cyr: 'pozharnikar' },
      { en: 'scientist', bg: 'учен', cyr: 'uchen' },
      { en: 'artist', bg: 'художник', cyr: 'hudozhnik' },
      { en: 'writer', bg: 'писател', cyr: 'pisatel' },
      { en: 'plumber', bg: 'водопроводчик', cyr: 'vodoprovodchik' }
    ],
  },
  {
    name: 'Jobs II',
    description: 'Cashier, secretary, receptionist, chef, guard',
    theme: 'frequency-vocab',
    order: 322,
    words: [
      { en: 'cashier', bg: 'касиер', cyr: 'kasier' },
      { en: 'secretary', bg: 'секретар', cyr: 'sekretar' },
      { en: 'receptionist', bg: 'рецепционист', cyr: 'retseptionist' },
      { en: 'chef', bg: 'готвач', cyr: 'gotvach' },
      { en: 'guard', bg: 'пазач', cyr: 'pazach' }
    ],
  },
  {
    name: 'Clothing I',
    description: 'Sock, glove, pajamas, slippers, sandal',
    theme: 'frequency-vocab',
    order: 323,
    words: [
      { en: 'sock', bg: 'чорап', cyr: 'chorap' },
      { en: 'glove', bg: 'ръкавица', cyr: 'rakavitsa' },
      { en: 'pajamas', bg: 'пижама', cyr: 'pizhama' },
      { en: 'slippers', bg: 'чехли', cyr: 'chehli' },
      { en: 'sandal', bg: 'сандал', cyr: 'sandal' }
    ],
  },
  {
    name: 'Clothing II',
    description: 'Tie, uniform, apron, tissue, napkin',
    theme: 'frequency-vocab',
    order: 324,
    words: [
      { en: 'tie', bg: 'вратовръзка', cyr: 'vratovrazka' },
      { en: 'uniform', bg: 'униформа', cyr: 'uniforma' },
      { en: 'apron', bg: 'престилка', cyr: 'prestilka' },
      { en: 'tissue', bg: 'кърпичка', cyr: 'karpichka' },
      { en: 'napkin', bg: 'салфетка', cyr: 'salfetka' }
    ],
  },
  {
    name: 'Everyday Abstracts',
    description: 'Example, mistake, change, difference, elderly',
    theme: 'frequency-vocab',
    order: 325,
    words: [
      { en: 'example', bg: 'пример', cyr: 'primer' },
      { en: 'mistake', bg: 'грешка', cyr: 'greshka' },
      { en: 'change', bg: 'промяна', cyr: 'promyana' },
      { en: 'difference', bg: 'разлика', cyr: 'razlika' },
      { en: 'elderly', bg: 'възрастен човек', cyr: 'vazrasten chovek' }
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
      SELECT "order" FROM heaps WHERE "order" >= 301
    ` as { order: number }[]
    const existingOrderSet = new Set(existingOrders.map(r => r.order))

    const toInsert = MAP14_HEAPS.filter(h => !existingOrderSet.has(h.order))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Map 14 heaps already seeded', inserted: 0 })
    }

    const { inserted, skipped, skippedWords } = await insertHeapsDeduped(sql, toInsert, 14)

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} Map 14 heaps (${skipped} duplicate words skipped)`,
      inserted,
      skipped,
      skippedWords,
    })
  } catch (err) {
    console.error('Seed-map14 error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
