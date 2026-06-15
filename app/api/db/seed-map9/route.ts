import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { insertHeapsDeduped } from '@/lib/seed'

// Map 9 — "Celestial Skies": heaps 201–225, riding the winds above the clouds.
const MAP9_HEAPS = [
  {
    name: 'Clouds: The White Fleeces',
    description: 'Soft drifts across the blue (валмо)',
    theme: 'Sky',
    order: 201,
    words: [
      { en: 'wisp', bg: 'валмо', cyr: 'valmo' },
      { en: 'haze', bg: 'мараня', cyr: 'maranya' },
      { en: 'vapor', bg: 'изпарение', cyr: 'izparenie' },
      { en: 'condensation', bg: 'конденз', cyr: 'kondenz' },
      { en: 'moisture', bg: 'влажност', cyr: 'vlazhnost' },
    ],
  },
  {
    name: 'Winds: The Breath',
    description: 'The sky exhales (хала)',
    theme: 'Wind',
    order: 202,
    words: [
      { en: 'gale', bg: 'хала', cyr: 'hala' },
      { en: 'breeze', bg: 'бриз', cyr: 'briz' },
      { en: 'gust', bg: 'порив', cyr: 'poriv' },
      { en: 'whirlwind', bg: 'смерч', cyr: 'smerch' },
      { en: 'zephyr', bg: 'зефир', cyr: 'zefir' },
    ],
  },
  {
    name: 'Stars: The Night Lights',
    description: 'Lanterns of the dark (светило)',
    theme: 'Stars',
    order: 203,
    words: [
      { en: 'luminary', bg: 'светило', cyr: 'svetilo' },
      { en: 'pleiad', bg: 'плеяда', cyr: 'pleyada' },
      { en: 'galaxy', bg: 'галактика', cyr: 'galaktika' },
      { en: 'Milky Way', bg: 'Млечен път', cyr: 'mlechen pat' },
      { en: 'meteor', bg: 'метеор', cyr: 'meteor' },
    ],
  },
  {
    name: "The Moon: Night's Lantern",
    description: 'Silver in the dark (месечина)',
    theme: 'Moon',
    order: 204,
    words: [
      { en: 'moon', bg: 'месечина', cyr: 'mesechina' },
      { en: 'crescent', bg: 'полумесец', cyr: 'polumesets' },
      { en: 'full moon', bg: 'пълнолуние', cyr: 'palnolunie' },
      { en: 'new moon', bg: 'новолуние', cyr: 'novolunie' },
      { en: 'orbit', bg: 'орбита', cyr: 'orbita' },
    ],
  },
  {
    name: "The Sun: Day's Eye",
    description: 'The great burning disk (слънчев диск)',
    theme: 'Sun',
    order: 205,
    words: [
      { en: 'sun disk', bg: 'слънчев диск', cyr: 'slanchev disk' },
      { en: 'radiance', bg: 'греене', cyr: 'greene' },
      { en: 'blaze', bg: 'пек', cyr: 'pek' },
      { en: 'daybreak', bg: 'разсъмване', cyr: 'razsamvane' },
      { en: 'sundown', bg: 'заник', cyr: 'zanik' },
    ],
  },
  {
    name: 'The Sky: Day & Night',
    description: 'The vault overhead (небосвод)',
    theme: 'Sky',
    order: 206,
    words: [
      { en: 'firmament', bg: 'небосвод', cyr: 'nebosvod' },
      { en: 'horizon', bg: 'кръгозор', cyr: 'kragozor' },
      { en: 'zenith', bg: 'зенит', cyr: 'zenit' },
      { en: 'expanse', bg: 'простор', cyr: 'prostor' },
      { en: 'glow', bg: 'заря', cyr: 'zarya' },
    ],
  },
  {
    name: "Weather: The Sky's Mood",
    description: 'When the heavens turn (порой)',
    theme: 'Weather',
    order: 207,
    words: [
      { en: 'downpour', bg: 'порой', cyr: 'poroy' },
      { en: 'lightning', bg: 'светкавица', cyr: 'svetkavitsa' },
      { en: 'thunder', bg: 'гръмотевица', cyr: 'gramotevitsa' },
      { en: 'icy rain', bg: 'леден дъжд', cyr: 'leden dazhd' },
      { en: 'snowfall', bg: 'снеговалеж', cyr: 'snegovalezh' },
    ],
  },
  {
    name: 'Cloud Types: High & Low',
    description: 'Naming the drifts (купест облак)',
    theme: 'Clouds',
    order: 208,
    words: [
      { en: 'cumulus', bg: 'купест облак', cyr: 'kupest oblak' },
      { en: 'stratus', bg: 'слоист облак', cyr: 'sloist oblak' },
      { en: 'cirrus', bg: 'перест облак', cyr: 'perest oblak' },
      { en: 'nimbus', bg: 'дъждовен облак', cyr: 'dazhdoven oblak' },
      { en: 'overcast', bg: 'облачност', cyr: 'oblachnost' },
    ],
  },
  {
    name: 'Flying Creatures: Sky Dwellers',
    description: 'Wings against the wind (кондор)',
    theme: 'Birds',
    order: 209,
    words: [
      { en: 'condor', bg: 'кондор', cyr: 'kondor' },
      { en: 'hawk', bg: 'ястреб', cyr: 'yastreb' },
      { en: 'swallow', bg: 'лястовица', cyr: 'lyastovitsa' },
      { en: 'lark', bg: 'чучулига', cyr: 'chuchuliga' },
      { en: 'crow', bg: 'гарван', cyr: 'garvan' },
    ],
  },
  {
    name: 'Flight: Going Up',
    description: 'Verbs of the air (хвърча)',
    theme: 'Flight',
    order: 210,
    words: [
      { en: 'to fly', bg: 'хвърча', cyr: 'hvarcha' },
      { en: 'to soar', bg: 'рея се', cyr: 'reya se' },
      { en: 'to glide', bg: 'планирам', cyr: 'planiram' },
      { en: 'to float', bg: 'нося се', cyr: 'nosya se' },
      { en: 'to hover', bg: 'вися', cyr: 'visya' },
    ],
  },
  {
    name: 'Balloons & Airships',
    description: 'Floating above it all (аеростат)',
    theme: 'Airships',
    order: 211,
    words: [
      { en: 'aerostat', bg: 'аеростат', cyr: 'aerostat' },
      { en: 'airship', bg: 'дирижабъл', cyr: 'dirizhabal' },
      { en: 'gondola', bg: 'гондола', cyr: 'gondola' },
      { en: 'envelope', bg: 'обвивка', cyr: 'obvivka' },
      { en: 'propeller', bg: 'витло', cyr: 'vitlo' },
    ],
  },
  {
    name: 'Kites & Gliders',
    description: 'Tethered to the breeze (хвърчило)',
    theme: 'Kites',
    order: 212,
    words: [
      { en: 'kite', bg: 'хвърчило', cyr: 'hvarchilo' },
      { en: 'string', bg: 'конец', cyr: 'konets' },
      { en: 'tail', bg: 'опашка', cyr: 'opashka' },
      { en: 'glider', bg: 'планеризъм', cyr: 'planerizam' },
      { en: 'aviation', bg: 'авиация', cyr: 'aviatsiya' },
    ],
  },
  {
    name: 'Storms: Sky Drama',
    description: 'When the air rages (стихия)',
    theme: 'Storms',
    order: 213,
    words: [
      { en: 'tempest', bg: 'стихия', cyr: 'stihiya' },
      { en: 'snowstorm', bg: 'фъртуна', cyr: 'fartuna' },
      { en: 'tornado', bg: 'торнадо', cyr: 'tornado' },
      { en: 'cyclone', bg: 'циклон', cyr: 'tsiklon' },
      { en: 'drought', bg: 'засуха', cyr: 'zasuha' },
    ],
  },
  {
    name: 'Atmosphere: Sky Layers',
    description: 'From ground to edge of space (атмосфера)',
    theme: 'Atmosphere',
    order: 214,
    words: [
      { en: 'atmosphere', bg: 'атмосфера', cyr: 'atmosfera' },
      { en: 'troposphere', bg: 'тропосфера', cyr: 'troposfera' },
      { en: 'stratosphere', bg: 'стратосфера', cyr: 'stratosfera' },
      { en: 'exosphere', bg: 'екзосфера', cyr: 'ekzosfera' },
      { en: 'ozone', bg: 'озон', cyr: 'ozon' },
    ],
  },
  {
    name: 'Colors of the Sky',
    description: 'Hues of dawn and dusk (лазур)',
    theme: 'Colors',
    order: 215,
    words: [
      { en: 'blue', bg: 'синьо', cyr: 'sinyo' },
      { en: 'azure', bg: 'лазур', cyr: 'lazur' },
      { en: 'crimson', bg: 'пурпур', cyr: 'purpur' },
      { en: 'golden', bg: 'златисто', cyr: 'zlatisto' },
      { en: 'mauve', bg: 'морав', cyr: 'morav' },
    ],
  },
  {
    name: 'Cloud Feelings',
    description: 'The heart looks up (ведрина)',
    theme: 'Poetry',
    order: 216,
    words: [
      { en: 'serenity', bg: 'ведрина', cyr: 'vedrina' },
      { en: 'awe', bg: 'възторг', cyr: 'vaztorg' },
      { en: 'infinity', bg: 'безкрайност', cyr: 'bezkraynost' },
      { en: 'liberty', bg: 'волност', cyr: 'volnost' },
      { en: 'reverie', bg: 'блян', cyr: 'blyan' },
    ],
  },
  {
    name: 'Air: The Invisible',
    description: 'What we cannot see (налягане)',
    theme: 'Air',
    order: 217,
    words: [
      { en: 'pressure', bg: 'налягане', cyr: 'nalyagane' },
      { en: 'vacuum', bg: 'вакуум', cyr: 'vakuum' },
      { en: 'density', bg: 'гъстота', cyr: 'gastota' },
      { en: 'bubble', bg: 'мехурче', cyr: 'mehurche' },
      { en: 'oxygen', bg: 'кислород', cyr: 'kislorod' },
    ],
  },
  {
    name: 'Angels & Spirits',
    description: 'Beings of the upper air (ангел)',
    theme: 'Mythical',
    order: 218,
    words: [
      { en: 'angel', bg: 'ангел', cyr: 'angel' },
      { en: 'wing', bg: 'крило', cyr: 'krilo' },
      { en: 'vision', bg: 'видение', cyr: 'videnie' },
      { en: 'phantom', bg: 'фантом', cyr: 'fantom' },
      { en: 'divine', bg: 'божествен', cyr: 'bozhestven' },
    ],
  },
  {
    name: 'Cloud Animals: Shapes Above',
    description: 'What the drifts become (змей)',
    theme: 'Imagination',
    order: 219,
    words: [
      { en: 'dragon', bg: 'змей', cyr: 'zmey' },
      { en: 'orca', bg: 'косатка', cyr: 'kosatka' },
      { en: 'pegasus', bg: 'пегас', cyr: 'pegas' },
      { en: 'chimera', bg: 'химера', cyr: 'himera' },
      { en: 'phoenix', bg: 'феникс', cyr: 'feniks' },
    ],
  },
  {
    name: 'Winged Horses',
    description: 'Galloping on the wind (жребец)',
    theme: 'Horses',
    order: 220,
    words: [
      { en: 'stallion', bg: 'жребец', cyr: 'zhrebets' },
      { en: 'winged', bg: 'крилат', cyr: 'krilat' },
      { en: 'gallop', bg: 'галоп', cyr: 'galop' },
      { en: 'mane', bg: 'грива', cyr: 'griva' },
      { en: 'hoof', bg: 'копито', cyr: 'kopito' },
    ],
  },
  {
    name: 'Observatories: Watching',
    description: 'Eyes on the heavens (обсерватория)',
    theme: 'Observatory',
    order: 221,
    words: [
      { en: 'observatory', bg: 'обсерватория', cyr: 'observatoriya' },
      { en: 'telescope', bg: 'телескоп', cyr: 'teleskop' },
      { en: 'lens', bg: 'леща', cyr: 'leshta' },
      { en: 'eyepiece', bg: 'окуляр', cyr: 'okulyar' },
      { en: 'binoculars', bg: 'бинокъл', cyr: 'binokal' },
    ],
  },
  {
    name: 'Astronomy: Star Science',
    description: 'Reading the night sky (астрономия)',
    theme: 'Astronomy',
    order: 222,
    words: [
      { en: 'astronomy', bg: 'астрономия', cyr: 'astronomiya' },
      { en: 'celestial body', bg: 'небесно тяло', cyr: 'nebesno tyalo' },
      { en: 'satellite', bg: 'сателит', cyr: 'satelit' },
      { en: 'eclipse', bg: 'затъмнение', cyr: 'zatamnenie' },
      { en: 'equinox', bg: 'равноденствие', cyr: 'ravnodenstvie' },
    ],
  },
  {
    name: 'Flags & Banners',
    description: 'Streaming in the high wind (флаг)',
    theme: 'Banners',
    order: 223,
    words: [
      { en: 'flag', bg: 'флаг', cyr: 'flag' },
      { en: 'banner', bg: 'банер', cyr: 'baner' },
      { en: 'crest', bg: 'герб', cyr: 'gerb' },
      { en: 'streamer', bg: 'лента', cyr: 'lenta' },
      { en: 'pennant', bg: 'вимпел', cyr: 'vimpel' },
    ],
  },
  {
    name: 'Above the Clouds',
    description: 'The highest reaches (превал)',
    theme: 'Summit',
    order: 224,
    words: [
      { en: 'summit', bg: 'превал', cyr: 'preval' },
      { en: 'ridge', bg: 'рид', cyr: 'rid' },
      { en: 'pinnacle', bg: 'връхна точка', cyr: 'vrahna tochka' },
      { en: 'panorama', bg: 'панорама', cyr: 'panorama' },
      { en: 'precipice', bg: 'урва', cyr: 'urva' },
    ],
  },
  {
    name: 'The Celestial Gate',
    description: 'The constellation gate (портал)',
    theme: 'Gate',
    order: 225,
    words: [
      { en: 'portal', bg: 'портал', cyr: 'portal' },
      { en: 'threshold', bg: 'преддверие', cyr: 'preddverie' },
      { en: 'arch', bg: 'извивка', cyr: 'izvivka' },
      { en: 'pillar', bg: 'стълб', cyr: 'stalb' },
      { en: 'keystone', bg: 'ключов камък', cyr: 'klyuchov kamak' },
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
      SELECT "order" FROM heaps WHERE "order" >= 201 AND "order" <= 225
    ` as { order: number }[]
    const existingOrderSet = new Set(existingOrders.map(r => r.order))

    const toInsert = MAP9_HEAPS.filter(h => !existingOrderSet.has(h.order))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Map 9 heaps already seeded', inserted: 0 })
    }

    const { inserted, skipped, skippedWords } = await insertHeapsDeduped(sql, toInsert, 9)

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} Map 9 heaps (${skipped} duplicate words skipped)`,
      inserted,
      skipped,
      skippedWords,
    })
  } catch (err) {
    console.error('Seed-map9 error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
