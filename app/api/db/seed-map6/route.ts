import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { insertHeapsDeduped } from '@/lib/seed'

// Map 6 — "Winter & Arctic": heaps 126–150, cold, snow, winter gear and the frozen north.
const MAP6_HEAPS = [
  {
    name: 'Tundra: The Frozen Land',
    description: 'A world of white and blue (тундра)',
    theme: 'Tundra',
    order: 126,
    words: [
      { en: 'tundra', bg: 'тундра', cyr: 'tundra' },
      { en: 'glacier', bg: 'ледник', cyr: 'lednik' },
      { en: 'iceberg', bg: 'айсберг', cyr: 'aysberg' },
      { en: 'snowdrift', bg: 'преспа', cyr: 'prespa' },
      { en: 'permafrost', bg: 'вечен лед', cyr: 'vechen led' },
    ],
  },
  {
    name: 'Arctic Beasts: The Hunters',
    description: 'Giants of the frozen sea (хищници)',
    theme: 'Wildlife',
    order: 127,
    words: [
      { en: 'polar bear', bg: 'полярна мечка', cyr: 'polyarna mechka' },
      { en: 'seal', bg: 'тюлен', cyr: 'tyulen' },
      { en: 'walrus', bg: 'морж', cyr: 'morzh' },
      { en: 'whale', bg: 'кит', cyr: 'kit' },
      { en: 'reindeer', bg: 'северен елен', cyr: 'severen elen' },
    ],
  },
  {
    name: 'Arctic Beasts: The Small Ones',
    description: 'Furred and quick on the ice (животни)',
    theme: 'Wildlife',
    order: 128,
    words: [
      { en: 'penguin', bg: 'пингвин', cyr: 'pingvin' },
      { en: 'husky', bg: 'хъски', cyr: 'haski' },
      { en: 'moose', bg: 'лос', cyr: 'los' },
      { en: 'otter', bg: 'видра', cyr: 'vidra' },
      { en: 'beaver', bg: 'бобър', cyr: 'bobar' },
    ],
  },
  {
    name: 'Chill: The Deep Cold',
    description: 'When the body turns to stone (студ)',
    theme: 'Cold',
    order: 129,
    words: [
      { en: 'cold', bg: 'студ', cyr: 'stud' },
      { en: 'freezing', bg: 'замръзване', cyr: 'zamrazvane' },
      { en: 'frostbite', bg: 'измръзване', cyr: 'izmrazvane' },
      { en: 'numbness', bg: 'вцепенение', cyr: 'vtsepenenie' },
      { en: 'icicle', bg: 'висулка', cyr: 'visulka' },
    ],
  },
  {
    name: 'Snow: Forms of White',
    description: 'Every shape the snow takes (сняг)',
    theme: 'Snow',
    order: 130,
    words: [
      { en: 'snowflake', bg: 'снежинка', cyr: 'snezhinka' },
      { en: 'snowman', bg: 'снежен човек', cyr: 'snezhen chovek' },
      { en: 'snowball', bg: 'снежна топка', cyr: 'snezhna topka' },
      { en: 'slush', bg: 'киша', cyr: 'kisha' },
      { en: 'crust', bg: 'наст', cyr: 'nast' },
    ],
  },
  {
    name: 'Winter Gear: Bundled Up',
    description: 'Layers against the freeze (екипировка)',
    theme: 'Clothing',
    order: 131,
    words: [
      { en: 'earmuffs', bg: 'наушници', cyr: 'naushnitsi' },
      { en: 'parka', bg: 'парка', cyr: 'parka' },
      { en: 'fur', bg: 'козина', cyr: 'kozina' },
      { en: 'goggles', bg: 'очила', cyr: 'ochila' },
      { en: 'snowshoes', bg: 'снегоходки', cyr: 'snegohodki' },
    ],
  },
  {
    name: 'Landscape: The White Plain',
    description: 'Read the frozen ground (пейзаж)',
    theme: 'Landscape',
    order: 132,
    words: [
      { en: 'plain', bg: 'равнина', cyr: 'ravnina' },
      { en: 'frozen lake', bg: 'замръзнало езеро', cyr: 'zamraznalo ezero' },
      { en: 'crevasse', bg: 'пукнатина', cyr: 'puknatina' },
      { en: 'snowfield', bg: 'снежно поле', cyr: 'snezhno pole' },
      { en: 'plateau', bg: 'плато', cyr: 'plato' },
    ],
  },
  {
    name: 'Polar Night: The Long Dark',
    description: 'Lights in the endless night (полярна нощ)',
    theme: 'Night',
    order: 133,
    words: [
      { en: 'aurora', bg: 'полярно сияние', cyr: 'polyarno siyanie' },
      { en: 'twilight', bg: 'здрач', cyr: 'zdrach' },
      { en: 'gloom', bg: 'мрак', cyr: 'mrak' },
      { en: 'moonlight', bg: 'лунна светлина', cyr: 'lunna svetlina' },
      { en: 'glimmer', bg: 'проблясък', cyr: 'problyasak' },
    ],
  },
  {
    name: 'Survival: Out on the Ice',
    description: 'Stay alive past nightfall (оцеляване)',
    theme: 'Survival',
    order: 134,
    words: [
      { en: 'igloo', bg: 'иглу', cyr: 'iglu' },
      { en: 'sled', bg: 'шейна', cyr: 'sheyna' },
      { en: 'stove', bg: 'печка', cyr: 'pechka' },
      { en: 'firewood', bg: 'дърва', cyr: 'darva' },
      { en: 'flint', bg: 'кремък', cyr: 'kremak' },
    ],
  },
  {
    name: 'Feelings: Frozen Resolve',
    description: 'The will that does not break (чувства)',
    theme: 'Feelings',
    order: 135,
    words: [
      { en: 'numb', bg: 'вкочанен', cyr: 'vkochanen' },
      { en: 'hopeful', bg: 'обнадежден', cyr: 'obnadezhden' },
      { en: 'determined', bg: 'решителен', cyr: 'reshitelen' },
      { en: 'exhausted', bg: 'изтощен', cyr: 'iztoshten' },
      { en: 'steady', bg: 'устойчив', cyr: 'ustoychiv' },
    ],
  },
  {
    name: 'Ice Fishing: Through the Hole',
    description: 'Patience over the frozen lake (риболов)',
    theme: 'Fishing',
    order: 136,
    words: [
      { en: 'fishing rod', bg: 'въдица', cyr: 'vadica' },
      { en: 'bait', bg: 'стръв', cyr: 'strav' },
      { en: 'hook', bg: 'кука', cyr: 'kuka' },
      { en: 'catch', bg: 'улов', cyr: 'ulov' },
      { en: 'hole', bg: 'дупка', cyr: 'dupka' },
    ],
  },
  {
    name: 'Sky: Arctic Weather',
    description: 'The cold front rolls in (време)',
    theme: 'Weather',
    order: 137,
    words: [
      { en: 'snowstorm', bg: 'снежна буря', cyr: 'snezhna burya' },
      { en: 'hard frost', bg: 'мраз', cyr: 'mraz' },
      { en: 'haze', bg: 'омара', cyr: 'omara' },
      { en: 'sleet', bg: 'суграшица', cyr: 'sugrashitsa' },
      { en: 'thaw', bg: 'размразяване', cyr: 'razmrazyavane' },
    ],
  },
  {
    name: 'Plants: Hardy Growth',
    description: 'Life that survives the freeze (растения)',
    theme: 'Plants',
    order: 138,
    words: [
      { en: 'lichen', bg: 'лишей', cyr: 'lishey' },
      { en: 'blueberry', bg: 'боровинка', cyr: 'borovinka' },
      { en: 'shrub', bg: 'храст', cyr: 'hrast' },
      { en: 'needle', bg: 'игла', cyr: 'igla' },
      { en: 'bark', bg: 'кора', cyr: 'kora' },
    ],
  },
  {
    name: 'Warmth: Hot Comfort',
    description: 'A warm cup by the fire (топлина)',
    theme: 'Food',
    order: 139,
    words: [
      { en: 'cocoa', bg: 'какао', cyr: 'kakao' },
      { en: 'broth', bg: 'бульон', cyr: 'bulyon' },
      { en: 'stew', bg: 'яхния', cyr: 'yahniya' },
      { en: 'warmth', bg: 'топлина', cyr: 'toplina' },
      { en: 'ginger', bg: 'джинджифил', cyr: 'dzhindzhifil' },
    ],
  },
  {
    name: 'Expedition: The Push North',
    description: 'Charting the frozen unknown (експедиция)',
    theme: 'Expedition',
    order: 140,
    words: [
      { en: 'expedition', bg: 'експедиция', cyr: 'ekspeditsiya' },
      { en: 'explorer', bg: 'изследовател', cyr: 'izsledovatel' },
      { en: 'flag', bg: 'знаме', cyr: 'zname' },
      { en: 'base', bg: 'база', cyr: 'baza' },
      { en: 'discovery', bg: 'откритие', cyr: 'otkritie' },
    ],
  },
  {
    name: 'Ice: Textures Underfoot',
    description: 'How the surface feels (лед)',
    theme: 'Textures',
    order: 141,
    words: [
      { en: 'slippery', bg: 'хлъзгав', cyr: 'hlazgav' },
      { en: 'smooth', bg: 'гладък', cyr: 'gladak' },
      { en: 'sharp', bg: 'остър', cyr: 'ostar' },
      { en: 'frozen', bg: 'замръзнал', cyr: 'zamraznal' },
      { en: 'crisp', bg: 'хрупкав', cyr: 'hrupkav' },
    ],
  },
  {
    name: 'Movement: Over the Ice',
    description: 'Verbs of the frozen trek (движение)',
    theme: 'Actions',
    order: 142,
    words: [
      { en: 'to slide', bg: 'плъзгам се', cyr: 'plazgam se' },
      { en: 'to freeze', bg: 'замръзвам', cyr: 'zamrazvam' },
      { en: 'to melt', bg: 'топя се', cyr: 'topya se' },
      { en: 'to shiver', bg: 'треперя', cyr: 'treperya' },
      { en: 'to skate', bg: 'пързалям се', cyr: 'parzalyam se' },
    ],
  },
  {
    name: 'Northern Village: The Cabin',
    description: 'Warmth behind shutters (село)',
    theme: 'Village',
    order: 143,
    words: [
      { en: 'cabin', bg: 'хижа', cyr: 'hizha' },
      { en: 'hearth', bg: 'огнище', cyr: 'ognishte' },
      { en: 'lamp', bg: 'лампа', cyr: 'lampa' },
      { en: 'shutter', bg: 'капак', cyr: 'kapak' },
      { en: 'threshold', bg: 'праг', cyr: 'prag' },
    ],
  },
  {
    name: 'Arctic Ocean: The Cold Sea',
    description: 'Black water under white ice (океан)',
    theme: 'Ocean',
    order: 144,
    words: [
      { en: 'ice floe', bg: 'леден блок', cyr: 'leden blok' },
      { en: 'current', bg: 'течение', cyr: 'techenie' },
      { en: 'tide', bg: 'прилив', cyr: 'priliv' },
      { en: 'foam', bg: 'пяна', cyr: 'pyana' },
      { en: 'fjord', bg: 'фиорд', cyr: 'fiord' },
    ],
  },
  {
    name: 'Cold Illness: Staying Well',
    description: 'When the chill gets in (здраве)',
    theme: 'Health',
    order: 145,
    words: [
      { en: 'cough', bg: 'кашлица', cyr: 'kashlitsa' },
      { en: 'sneeze', bg: 'кихане', cyr: 'kihane' },
      { en: 'cold', bg: 'настинка', cyr: 'nastinka' },
      { en: 'remedy', bg: 'цяр', cyr: 'tsyar' },
      { en: 'recovery', bg: 'възстановяване', cyr: 'vazstanovyavane' },
    ],
  },
  {
    name: 'Frozen Time: The Slow Hours',
    description: 'Time crawls in the cold (време)',
    theme: 'Time',
    order: 146,
    words: [
      { en: 'hour', bg: 'час', cyr: 'chas' },
      { en: 'minute', bg: 'минута', cyr: 'minuta' },
      { en: 'moment', bg: 'миг', cyr: 'mig' },
      { en: 'delay', bg: 'закъснение', cyr: 'zakasnenie' },
      { en: 'forever', bg: 'завинаги', cyr: 'zavinagi' },
    ],
  },
  {
    name: 'Sounds: Voice of the Ice',
    description: 'What you hear in the silence (звуци)',
    theme: 'Sounds',
    order: 147,
    words: [
      { en: 'crack', bg: 'пукот', cyr: 'pukot' },
      { en: 'howl', bg: 'вой', cyr: 'voy' },
      { en: 'echo', bg: 'ехо', cyr: 'eho' },
      { en: 'whisper', bg: 'шепот', cyr: 'shepot' },
      { en: 'rumble', bg: 'тътен', cyr: 'taten' },
    ],
  },
  {
    name: 'Colors: Shades of Ice',
    description: 'The palette of the cold (цветове)',
    theme: 'Colors',
    order: 148,
    words: [
      { en: 'icy blue', bg: 'леденосин', cyr: 'ledenosin' },
      { en: 'snow white', bg: 'снежнобял', cyr: 'snezhnobyal' },
      { en: 'frosty', bg: 'скрежен', cyr: 'skrezhen' },
      { en: 'transparent', bg: 'прозрачен', cyr: 'prozrachen' },
      { en: 'shiny', bg: 'лъскав', cyr: 'laskav' },
    ],
  },
  {
    name: 'Polar Emotions: The Solitude',
    description: 'The heart in the white silence (чувства)',
    theme: 'Emotions',
    order: 149,
    words: [
      { en: 'wonder', bg: 'удивление', cyr: 'udivlenie' },
      { en: 'loneliness', bg: 'самота', cyr: 'samota' },
      { en: 'endurance', bg: 'издръжливост', cyr: 'izdrazhlivost' },
      { en: 'stillness', bg: 'спокойствие', cyr: 'spokoystvie' },
      { en: 'awe', bg: 'прехлас', cyr: 'prehlas' },
    ],
  },
  {
    name: "Journey's End: Reaching Safety",
    description: 'Warmth at the edge of the ice (спасение)',
    theme: 'Journey',
    order: 150,
    words: [
      { en: 'shelter', bg: 'подслон', cyr: 'podslon' },
      { en: 'safety', bg: 'безопасност', cyr: 'bezopasnost' },
      { en: 'triumph', bg: 'триумф', cyr: 'triumf' },
      { en: 'gratitude', bg: 'признателност', cyr: 'priznatelnost' },
      { en: 'to survive', bg: 'оцелявам', cyr: 'otselyavam' },
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
      SELECT "order" FROM heaps WHERE "order" >= 126
    ` as { order: number }[]
    const existingOrderSet = new Set(existingOrders.map(r => r.order))

    const toInsert = MAP6_HEAPS.filter(h => !existingOrderSet.has(h.order))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Map 6 heaps already seeded', inserted: 0 })
    }

    const { inserted, skipped, skippedWords } = await insertHeapsDeduped(sql, toInsert, 6)

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} Map 6 heaps (${skipped} duplicate words skipped)`,
      inserted,
      skipped,
      skippedWords,
    })
  } catch (err) {
    console.error('Seed-map6 error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
