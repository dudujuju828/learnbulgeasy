import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { insertHeapsDeduped } from '@/lib/seed'

// Map 4 — "Mountain Pass": heaps 76–100, the trek over the high ranges.
const MAP4_HEAPS = [
  {
    name: 'Peaks: The Heights',
    description: 'Where the land touches the sky (върхове)',
    theme: 'Peaks',
    order: 76,
    words: [
      { en: 'summit', bg: 'връх', cyr: 'vrah' },
      { en: 'ridge', bg: 'било', cyr: 'bilo' },
      { en: 'cliff', bg: 'скала', cyr: 'skala' },
      { en: 'slope', bg: 'склон', cyr: 'sklon' },
      { en: 'mountain pass', bg: 'проход', cyr: 'prohod' },
    ],
  },
  {
    name: 'Climbing: Gear',
    description: 'Strap in for the ascent (екипировка)',
    theme: 'Climbing',
    order: 77,
    words: [
      { en: 'rope', bg: 'въже', cyr: 'vazhe' },
      { en: 'backpack', bg: 'раница', cyr: 'ranitsa' },
      { en: 'tent', bg: 'палатка', cyr: 'palatka' },
      { en: 'boot', bg: 'ботуш', cyr: 'botush' },
      { en: 'helmet', bg: 'каска', cyr: 'kaska' },
    ],
  },
  {
    name: 'Trail: Finding the Way',
    description: 'Follow the markers up (маршрут)',
    theme: 'Trail',
    order: 78,
    words: [
      { en: 'route', bg: 'маршрут', cyr: 'marshrut' },
      { en: 'compass', bg: 'компас', cyr: 'kompas' },
      { en: 'guide', bg: 'водач', cyr: 'vodach' },
      { en: 'sign', bg: 'знак', cyr: 'znak' },
      { en: 'shelter', bg: 'заслон', cyr: 'zaslon' },
    ],
  },
  {
    name: 'High Weather: Cold Front',
    description: 'Storms above the tree line (студ)',
    theme: 'Weather',
    order: 79,
    words: [
      { en: 'frost', bg: 'слана', cyr: 'slana' },
      { en: 'ice', bg: 'лед', cyr: 'led' },
      { en: 'hail', bg: 'градушка', cyr: 'gradushka' },
      { en: 'avalanche', bg: 'лавина', cyr: 'lavina' },
      { en: 'blizzard', bg: 'виелица', cyr: 'vielitsa' },
    ],
  },
  {
    name: 'Wildlife: Highland Beasts',
    description: 'Creatures of the cliffs (диви животни)',
    theme: 'Wildlife',
    order: 80,
    words: [
      { en: 'eagle', bg: 'орел', cyr: 'orel' },
      { en: 'goat', bg: 'коза', cyr: 'koza' },
      { en: 'snake', bg: 'змия', cyr: 'zmiya' },
      { en: 'lizard', bg: 'гущер', cyr: 'gushter' },
      { en: 'boar', bg: 'глиган', cyr: 'gligan' },
    ],
  },
  {
    name: 'Forest: The Pines',
    description: 'Deep evergreen slopes (гора)',
    theme: 'Forest',
    order: 81,
    words: [
      { en: 'pine', bg: 'бор', cyr: 'bor' },
      { en: 'fir', bg: 'ела', cyr: 'ela' },
      { en: 'moss', bg: 'мъх', cyr: 'mah' },
      { en: 'mushroom', bg: 'гъба', cyr: 'gaba' },
      { en: 'root', bg: 'корен', cyr: 'koren' },
    ],
  },
  {
    name: 'Water: Mountain Streams',
    description: 'Cold water running down (вода)',
    theme: 'Water',
    order: 82,
    words: [
      { en: 'stream', bg: 'поток', cyr: 'potok' },
      { en: 'waterfall', bg: 'водопад', cyr: 'vodopad' },
      { en: 'spring', bg: 'извор', cyr: 'izvor' },
      { en: 'pool', bg: 'вир', cyr: 'vir' },
      { en: 'shore', bg: 'бряг', cyr: 'bryag' },
    ],
  },
  {
    name: 'Earth: Rock & Soil',
    description: 'The ground beneath your boots (земя)',
    theme: 'Earth',
    order: 83,
    words: [
      { en: 'rock', bg: 'камък', cyr: 'kamak' },
      { en: 'boulder', bg: 'канара', cyr: 'kanara' },
      { en: 'gravel', bg: 'чакъл', cyr: 'chakal' },
      { en: 'clay', bg: 'глина', cyr: 'glina' },
      { en: 'dust', bg: 'прах', cyr: 'prah' },
    ],
  },
  {
    name: 'Camp: After Dark',
    description: 'Set up for the night (лагер)',
    theme: 'Camp',
    order: 84,
    words: [
      { en: 'fire', bg: 'огън', cyr: 'ogan' },
      { en: 'sleeping bag', bg: 'спален чувал', cyr: 'spalen chuval' },
      { en: 'lantern', bg: 'фенер', cyr: 'fener' },
      { en: 'matches', bg: 'кибрит', cyr: 'kibrit' },
      { en: 'pot', bg: 'тенджера', cyr: 'tendzhera' },
    ],
  },
  {
    name: 'Survival: Staying Safe',
    description: 'When the trail turns hard (оцеляване)',
    theme: 'Survival',
    order: 85,
    words: [
      { en: 'rescue', bg: 'спасяване', cyr: 'spasyavane' },
      { en: 'whistle', bg: 'свирка', cyr: 'svirka' },
      { en: 'signal', bg: 'сигнал', cyr: 'signal' },
      { en: 'first aid', bg: 'първа помощ', cyr: 'parva pomosht' },
      { en: 'survival', bg: 'оцеляване', cyr: 'otselyavane' },
    ],
  },
  {
    name: 'Body: The Effort',
    description: 'What the climb asks of you (тяло)',
    theme: 'Body',
    order: 86,
    words: [
      { en: 'breath', bg: 'дъх', cyr: 'dah' },
      { en: 'sweat', bg: 'пот', cyr: 'pot' },
      { en: 'muscle', bg: 'мускул', cyr: 'muskul' },
      { en: 'ankle', bg: 'глезен', cyr: 'glezen' },
      { en: 'strength', bg: 'сила', cyr: 'sila' },
    ],
  },
  {
    name: 'Directions: Up & Down',
    description: 'Orient yourself on the slope (посоки)',
    theme: 'Directions',
    order: 87,
    words: [
      { en: 'upward', bg: 'нагоре', cyr: 'nagore' },
      { en: 'downward', bg: 'надолу', cyr: 'nadolu' },
      { en: 'height', bg: 'височина', cyr: 'visochina' },
      { en: 'depth', bg: 'дълбочина', cyr: 'dalbochina' },
      { en: 'edge', bg: 'ръб', cyr: 'rab' },
    ],
  },
  {
    name: 'Sky: Above the Peaks',
    description: 'Look up from the summit (небе)',
    theme: 'Sky',
    order: 88,
    words: [
      { en: 'sky', bg: 'небе', cyr: 'nebe' },
      { en: 'star', bg: 'звезда', cyr: 'zvezda' },
      { en: 'moon', bg: 'луна', cyr: 'luna' },
      { en: 'sunrise', bg: 'изгрев', cyr: 'izgrev' },
      { en: 'sunset', bg: 'залез', cyr: 'zalez' },
    ],
  },
  {
    name: 'Cold Gear: Wrapped Up',
    description: 'Layers against the chill (топли дрехи)',
    theme: 'Clothing',
    order: 89,
    words: [
      { en: 'coat', bg: 'палто', cyr: 'palto' },
      { en: 'sweater', bg: 'пуловер', cyr: 'pulover' },
      { en: 'thermos', bg: 'термос', cyr: 'termos' },
      { en: 'blanket', bg: 'одеяло', cyr: 'odeyalo' },
      { en: 'skis', bg: 'ски', cyr: 'ski' },
    ],
  },
  {
    name: 'Village: The Hamlet',
    description: 'A settlement in the valley (село)',
    theme: 'Village',
    order: 90,
    words: [
      { en: 'village', bg: 'село', cyr: 'selo' },
      { en: 'house', bg: 'къща', cyr: 'kashta' },
      { en: 'roof', bg: 'покрив', cyr: 'pokriv' },
      { en: 'chimney', bg: 'комин', cyr: 'komin' },
      { en: 'well', bg: 'кладенец', cyr: 'kladenets' },
    ],
  },
  {
    name: 'Farm: The Herd',
    description: 'Animals of the highland farm (ферма)',
    theme: 'Farm',
    order: 91,
    words: [
      { en: 'sheep', bg: 'овца', cyr: 'ovtsa' },
      { en: 'cow', bg: 'крава', cyr: 'krava' },
      { en: 'donkey', bg: 'магаре', cyr: 'magare' },
      { en: 'hen', bg: 'кокошка', cyr: 'kokoshka' },
      { en: 'pig', bg: 'прасе', cyr: 'prase' },
    ],
  },
  {
    name: 'Plants: Wild Growth',
    description: 'Herbs along the path (растения)',
    theme: 'Plants',
    order: 92,
    words: [
      { en: 'herb', bg: 'билка', cyr: 'bilka' },
      { en: 'thorn', bg: 'трън', cyr: 'tran' },
      { en: 'raspberry', bg: 'малина', cyr: 'malina' },
      { en: 'nettle', bg: 'коприва', cyr: 'kopriva' },
      { en: 'fern', bg: 'папрат', cyr: 'paprat' },
    ],
  },
  {
    name: 'Time: The Day Turns',
    description: 'Hours on the mountain (време)',
    theme: 'Time',
    order: 93,
    words: [
      { en: 'dawn', bg: 'зора', cyr: 'zora' },
      { en: 'noon', bg: 'обед', cyr: 'obed' },
      { en: 'afternoon', bg: 'следобед', cyr: 'sledobed' },
      { en: 'evening', bg: 'вечер', cyr: 'vecher' },
      { en: 'midnight', bg: 'полунощ', cyr: 'polunosht' },
    ],
  },
  {
    name: 'Colors: Of the Wild',
    description: 'Shades of stone and sky (цветове)',
    theme: 'Colors',
    order: 94,
    words: [
      { en: 'brown', bg: 'кафяв', cyr: 'kafyav' },
      { en: 'gray', bg: 'сив', cyr: 'siv' },
      { en: 'white', bg: 'бял', cyr: 'byal' },
      { en: 'golden', bg: 'златен', cyr: 'zlaten' },
      { en: 'silver', bg: 'сребърен', cyr: 'srebaren' },
    ],
  },
  {
    name: 'Feelings: On the Trail',
    description: 'What the heights stir in you (чувства)',
    theme: 'Feelings',
    order: 95,
    words: [
      { en: 'brave', bg: 'смел', cyr: 'smel' },
      { en: 'calm', bg: 'спокоен', cyr: 'spokoen' },
      { en: 'strong', bg: 'силен', cyr: 'silen' },
      { en: 'free', bg: 'свободен', cyr: 'svoboden' },
      { en: 'lonely', bg: 'самотен', cyr: 'samoten' },
    ],
  },
  {
    name: 'Actions: The Climb',
    description: 'Verbs of the ascent (действия)',
    theme: 'Actions',
    order: 96,
    words: [
      { en: 'to climb', bg: 'катеря се', cyr: 'katerya se' },
      { en: 'to jump', bg: 'скачам', cyr: 'skacham' },
      { en: 'to fall', bg: 'падам', cyr: 'padam' },
      { en: 'to breathe', bg: 'дишам', cyr: 'disham' },
      { en: 'to carry', bg: 'нося', cyr: 'nosya' },
    ],
  },
  {
    name: 'Summit: The Reward',
    description: 'What waits at the top (награда)',
    theme: 'Summit',
    order: 97,
    words: [
      { en: 'view', bg: 'гледка', cyr: 'gledka' },
      { en: 'silence', bg: 'тишина', cyr: 'tishina' },
      { en: 'peace', bg: 'мир', cyr: 'mir' },
      { en: 'victory', bg: 'победа', cyr: 'pobeda' },
      { en: 'pride', bg: 'гордост', cyr: 'gordost' },
    ],
  },
  {
    name: 'Tools: For the Job',
    description: 'Hardware for the trek (инструменти)',
    theme: 'Tools',
    order: 98,
    words: [
      { en: 'axe', bg: 'брадва', cyr: 'bradva' },
      { en: 'hammer', bg: 'чук', cyr: 'chuk' },
      { en: 'nail', bg: 'пирон', cyr: 'piron' },
      { en: 'saw', bg: 'трион', cyr: 'trion' },
      { en: 'shovel', bg: 'лопата', cyr: 'lopata' },
    ],
  },
  {
    name: 'Trail Food: Provisions',
    description: 'Energy for the climb (провизии)',
    theme: 'Food',
    order: 99,
    words: [
      { en: 'honey', bg: 'мед', cyr: 'med' },
      { en: 'nuts', bg: 'ядки', cyr: 'yadki' },
      { en: 'dried fruit', bg: 'сушени плодове', cyr: 'susheni plodove' },
      { en: 'chocolate', bg: 'шоколад', cyr: 'shokolad' },
      { en: 'biscuit', bg: 'бисквита', cyr: 'biskvita' },
    ],
  },
  {
    name: "Journey's End: Down Again",
    description: 'Carrying the climb home (завръщане)',
    theme: 'Journey',
    order: 100,
    words: [
      { en: 'return', bg: 'завръщане', cyr: 'zavrashtane' },
      { en: 'memory', bg: 'спомен', cyr: 'spomen' },
      { en: 'photo', bg: 'снимка', cyr: 'snimka' },
      { en: 'souvenir', bg: 'сувенир', cyr: 'suvenir' },
      { en: 'end', bg: 'край', cyr: 'kray' },
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
      SELECT "order" FROM heaps WHERE "order" >= 76
    ` as { order: number }[]
    const existingOrderSet = new Set(existingOrders.map(r => r.order))

    const toInsert = MAP4_HEAPS.filter(h => !existingOrderSet.has(h.order))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Map 4 heaps already seeded', inserted: 0 })
    }

    const { inserted, skipped, skippedWords } = await insertHeapsDeduped(sql, toInsert, 4)

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} Map 4 heaps (${skipped} duplicate words skipped)`,
      inserted,
      skipped,
      skippedWords,
    })
  } catch (err) {
    console.error('Seed-map4 error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
