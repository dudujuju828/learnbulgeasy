import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { insertHeapsDeduped } from '@/lib/seed'

// Map 10 — "The Murky Swamp": heaps 226–250, wading into the Bulgarian marshlands.
const MAP10_HEAPS = [
  {
    name: 'Bog Plants: The Green Mat',
    description: 'What grows in the standing water (папур)',
    theme: 'Plants',
    order: 226,
    words: [
      { en: 'cattail', bg: 'папур', cyr: 'papur' },
      { en: 'osier', bg: 'ракита', cyr: 'rakita' },
      { en: 'sphagnum', bg: 'сфагнум', cyr: 'sfagnum' },
      { en: 'sedge', bg: 'острица', cyr: 'ostritsa' },
      { en: 'horsetail', bg: 'хвощ', cyr: 'hvosht' },
    ],
  },
  {
    name: 'Swamp Creatures: The Lurkers',
    description: 'Eyes above the waterline (алигатор)',
    theme: 'Creatures',
    order: 227,
    words: [
      { en: 'alligator', bg: 'алигатор', cyr: 'aligator' },
      { en: 'crocodile', bg: 'крокодил', cyr: 'krokodil' },
      { en: 'frog', bg: 'жаба', cyr: 'zhaba' },
      { en: 'newt', bg: 'тритон', cyr: 'triton' },
      { en: 'leech', bg: 'пиявица', cyr: 'piyavitsa' },
    ],
  },
  {
    name: 'Mud & Mire: The Sucking Ground',
    description: 'It grabs at your boots (тиня)',
    theme: 'Mud',
    order: 228,
    words: [
      { en: 'ooze', bg: 'тиня', cyr: 'tinya' },
      { en: 'silt', bg: 'утайка', cyr: 'utayka' },
      { en: 'slime', bg: 'слуз', cyr: 'sluz' },
      { en: 'sludge', bg: 'мътилка', cyr: 'matilka' },
      { en: 'quicksand', bg: 'плаващи пясъци', cyr: 'plavashti pyasatsi' },
    ],
  },
  {
    name: 'Water Channels: Slow Veins',
    description: 'Where the water creeps through (вада)',
    theme: 'Channels',
    order: 229,
    words: [
      { en: 'channel', bg: 'проток', cyr: 'protok' },
      { en: 'side-arm', bg: 'ръкав', cyr: 'rakav' },
      { en: 'riverbed', bg: 'корито', cyr: 'korito' },
      { en: 'brook', bg: 'вада', cyr: 'vada' },
      { en: 'creek', bg: 'бара', cyr: 'bara' },
    ],
  },
  {
    name: 'Swamp Trees: Roots in Water',
    description: 'Trunks standing in the wet (кипарис)',
    theme: 'Trees',
    order: 230,
    words: [
      { en: 'cypress', bg: 'кипарис', cyr: 'kiparis' },
      { en: 'willow', bg: 'ива', cyr: 'iva' },
      { en: 'alder', bg: 'елша', cyr: 'elsha' },
      { en: 'poplar', bg: 'топола', cyr: 'topola' },
      { en: 'ash tree', bg: 'ясен', cyr: 'yasen' },
    ],
  },
  {
    name: 'Marsh Birds: The Waders',
    description: 'Long legs in the shallows (чапла)',
    theme: 'Birds',
    order: 231,
    words: [
      { en: 'heron', bg: 'чапла', cyr: 'chapla' },
      { en: 'crane', bg: 'жерав', cyr: 'zherav' },
      { en: 'ibis', bg: 'ибис', cyr: 'ibis' },
      { en: 'marsh harrier', bg: 'блатар', cyr: 'blatar' },
      { en: 'grebe', bg: 'гмурец', cyr: 'gmurets' },
    ],
  },
  {
    name: 'Swamp Feelings: The Heavy Air',
    description: 'What the silence presses in (застой)',
    theme: 'Feelings',
    order: 232,
    words: [
      { en: 'dread', bg: 'страх', cyr: 'strah' },
      { en: 'stillness', bg: 'застой', cyr: 'zastoy' },
      { en: 'decay', bg: 'тлен', cyr: 'tlen' },
      { en: 'rot', bg: 'гнилоч', cyr: 'gniloch' },
      { en: 'solitude', bg: 'усамотение', cyr: 'usamotenie' },
    ],
  },
  {
    name: 'Mosquitoes & Flies: The Cloud',
    description: 'They rise at dusk (комар)',
    theme: 'Insects',
    order: 233,
    words: [
      { en: 'mosquito', bg: 'комар', cyr: 'komar' },
      { en: 'gnat', bg: 'мушица', cyr: 'mushitsa' },
      { en: 'fly', bg: 'муха', cyr: 'muha' },
      { en: 'wasp', bg: 'оса', cyr: 'osa' },
      { en: 'horsefly', bg: 'конска муха', cyr: 'konska muha' },
    ],
  },
  {
    name: 'Amphibians: The Damp Skin',
    description: 'Born in the water (земноводно)',
    theme: 'Amphibians',
    order: 234,
    words: [
      { en: 'toad', bg: 'крастава жаба', cyr: 'krastava zhaba' },
      { en: 'axolotl', bg: 'аксолотъл', cyr: 'aksolotal' },
      { en: 'tadpole', bg: 'попова лъжичка', cyr: 'popova lazhichka' },
      { en: 'amphibian', bg: 'земноводно', cyr: 'zemnovodno' },
      { en: 'fire salamander', bg: 'дъждовник', cyr: 'dazhdovnik' },
    ],
  },
  {
    name: 'Fishing the Swamp: Still Hunt',
    description: 'Patience over the murk (въдичар)',
    theme: 'Fishing',
    order: 235,
    words: [
      { en: 'angler', bg: 'въдичар', cyr: 'vadichar' },
      { en: 'hook', bg: 'кукичка', cyr: 'kukichka' },
      { en: 'bait', bg: 'примамка', cyr: 'primamka' },
      { en: 'cast net', bg: 'серкме', cyr: 'serkme' },
      { en: 'float', bg: 'плувка', cyr: 'pluvka' },
    ],
  },
  {
    name: 'Swamp Flowers: Bright on Black',
    description: 'Blooms on the dark water (лотос)',
    theme: 'Flowers',
    order: 236,
    words: [
      { en: 'lily', bg: 'лилия', cyr: 'liliya' },
      { en: 'lotus', bg: 'лотос', cyr: 'lotos' },
      { en: 'iris', bg: 'перуника', cyr: 'perunika' },
      { en: 'marsh marigold', bg: 'блатняк', cyr: 'blatnyak' },
      { en: 'water lily', bg: 'ненуфар', cyr: 'nenufar' },
    ],
  },
  {
    name: 'Reptiles: Cold Blood',
    description: 'Basking on a sunken log (смок)',
    theme: 'Reptiles',
    order: 237,
    words: [
      { en: 'turtle', bg: 'костенурка', cyr: 'kostenurka' },
      { en: 'viper', bg: 'усойница', cyr: 'usoynitsa' },
      { en: 'iguana', bg: 'игуана', cyr: 'iguana' },
      { en: 'gecko', bg: 'гекон', cyr: 'gekon' },
      { en: 'grass snake', bg: 'смок', cyr: 'smok' },
    ],
  },
  {
    name: 'Murky Waters: Nothing Below',
    description: "You can't see your hand (мътен)",
    theme: 'Water',
    order: 238,
    words: [
      { en: 'murky', bg: 'мътен', cyr: 'maten' },
      { en: 'stagnant', bg: 'застоял', cyr: 'zastoyal' },
      { en: 'brackish', bg: 'възсолен', cyr: 'vazsolen' },
      { en: 'tea-colored', bg: 'кафеникав', cyr: 'kafenikav' },
      { en: 'impenetrable', bg: 'непрогледен', cyr: 'neprogleden' },
    ],
  },
  {
    name: 'Swamp Sounds: The Night Chorus',
    description: 'The dark is never quiet (крякане)',
    theme: 'Sounds',
    order: 239,
    words: [
      { en: 'croak', bg: 'крякане', cyr: 'kryakane' },
      { en: 'buzz', bg: 'бръмчене', cyr: 'bramchene' },
      { en: 'crackle', bg: 'пращене', cyr: 'prashtene' },
      { en: 'splash', bg: 'плисък', cyr: 'plisak' },
      { en: 'chirp', bg: 'цвърчене', cyr: 'tsvarchene' },
    ],
  },
  {
    name: 'Fog & Mist: The Grey Veil',
    description: 'It hangs over the reeds (мъглявина)',
    theme: 'Fog',
    order: 240,
    words: [
      { en: 'haze', bg: 'мъглявина', cyr: 'maglyavina' },
      { en: 'smoke-haze', bg: 'пушек', cyr: 'pushek' },
      { en: 'stifling', bg: 'задушлив', cyr: 'zadushliv' },
      { en: 'damp air', bg: 'влажен въздух', cyr: 'vlazhen vazduh' },
      { en: 'gloom', bg: 'сумрак', cyr: 'sumrak' },
    ],
  },
  {
    name: 'Swamp Dangers: One Wrong Step',
    description: 'The ground that swallows (въртоп)',
    theme: 'Dangers',
    order: 241,
    words: [
      { en: 'sinking', bg: 'пропадане', cyr: 'propadane' },
      { en: 'marsh gas', bg: 'блатен газ', cyr: 'blaten gaz' },
      { en: 'sinkhole', bg: 'въртоп', cyr: 'vartop' },
      { en: 'treacherous', bg: 'коварен', cyr: 'kovaren' },
      { en: 'subsidence', bg: 'хлътване', cyr: 'hlatvane' },
    ],
  },
  {
    name: 'Fisherfolk: The Flat Boat',
    description: 'Poling through the channels (рибар)',
    theme: 'Boats',
    order: 242,
    words: [
      { en: 'fisherman', bg: 'рибар', cyr: 'ribar' },
      { en: 'canoe', bg: 'кану', cyr: 'kanu' },
      { en: 'paddle', bg: 'гребло', cyr: 'greblo' },
      { en: 'oar', bg: 'весло', cyr: 'veslo' },
      { en: 'jetty', bg: 'пристан', cyr: 'pristan' },
    ],
  },
  {
    name: 'Swamp Canopy: The Green Ceiling',
    description: 'Light filtered to a trickle (балдахин)',
    theme: 'Canopy',
    order: 243,
    words: [
      { en: 'canopy', bg: 'балдахин', cyr: 'baldahin' },
      { en: 'foliage', bg: 'шумак', cyr: 'shumak' },
      { en: 'leaf cover', bg: 'листак', cyr: 'listak' },
      { en: 'twilit', bg: 'здрачен', cyr: 'zdrachen' },
      { en: 'half-dark', bg: 'полумрак', cyr: 'polumrak' },
    ],
  },
  {
    name: 'Tiny Swamp Life: Underfoot',
    description: 'The small things in the shallows (охлюв)',
    theme: 'Small Life',
    order: 244,
    words: [
      { en: 'snail', bg: 'охлюв', cyr: 'ohlyuv' },
      { en: 'crawfish', bg: 'рак', cyr: 'rak' },
      { en: 'larva', bg: 'ларва', cyr: 'larva' },
      { en: 'grub', bg: 'личинка', cyr: 'lichinka' },
      { en: 'water strider', bg: 'водомерка', cyr: 'vodomerka' },
    ],
  },
  {
    name: 'Swamp Tools: For the Wet',
    description: 'What you carry through the bog (мачете)',
    theme: 'Tools',
    order: 245,
    words: [
      { en: 'machete', bg: 'мачете', cyr: 'machete' },
      { en: 'waders', bg: 'гащеризон', cyr: 'gashterizon' },
      { en: 'torch', bg: 'факел', cyr: 'fakel' },
      { en: 'gaff', bg: 'остен', cyr: 'osten' },
      { en: 'hatchet', bg: 'брадвичка', cyr: 'bradvichka' },
    ],
  },
  {
    name: 'Mangroves: Where Land Meets Tide',
    description: 'Roots arching from the water (естуар)',
    theme: 'Mangroves',
    order: 246,
    words: [
      { en: 'mangrove forest', bg: 'мангрова гора', cyr: 'mangrova gora' },
      { en: 'prop roots', bg: 'въздушни корени', cyr: 'vazdushni koreni' },
      { en: 'estuary', bg: 'естуар', cyr: 'estuar' },
      { en: 'delta', bg: 'делта', cyr: 'delta' },
      { en: 'lagoon', bg: 'лиман', cyr: 'liman' },
    ],
  },
  {
    name: 'Swamp at Night: After Dark',
    description: 'When the swamp wakes up (кукумявка)',
    theme: 'Night',
    order: 247,
    words: [
      { en: 'moth', bg: 'нощна пеперуда', cyr: 'noshtna peperuda' },
      { en: 'little owl', bg: 'кукумявка', cyr: 'kukumyavka' },
      { en: 'will-o-wisp', bg: 'блатно огънче', cyr: 'blatno oganche' },
      { en: 'bat', bg: 'нощница', cyr: 'noshtnitsa' },
      { en: 'predator', bg: 'хищник', cyr: 'hishtnik' },
    ],
  },
  {
    name: 'Marsh Grasses: The Whispering Stand',
    description: 'Taller than your head (камъш)',
    theme: 'Grasses',
    order: 248,
    words: [
      { en: 'sedge tuft', bg: 'осока', cyr: 'osoka' },
      { en: 'rush', bg: 'ситник', cyr: 'sitnik' },
      { en: 'bulrush', bg: 'камъш', cyr: 'kamash' },
      { en: 'blade of grass', bg: 'тревица', cyr: 'trevitsa' },
      { en: 'fescue', bg: 'власатка', cyr: 'vlasatka' },
    ],
  },
  {
    name: 'Peat & Swamp Soil: The Black Earth',
    description: 'Centuries pressed into the ground (торф)',
    theme: 'Soil',
    order: 249,
    words: [
      { en: 'peat', bg: 'торф', cyr: 'torf' },
      { en: 'loess', bg: 'льос', cyr: 'lyos' },
      { en: 'soil', bg: 'пръст', cyr: 'pyrst' },
      { en: 'humus', bg: 'хумус', cyr: 'humus' },
      { en: 'peat bog', bg: 'торфище', cyr: 'torfishte' },
    ],
  },
  {
    name: 'The Open Bog: Journey’s End',
    description: 'The wide, wet heart of it all (тресавище)',
    theme: 'Bog',
    order: 250,
    words: [
      { en: 'bog', bg: 'блато', cyr: 'blato' },
      { en: 'mire', bg: 'мочур', cyr: 'mochur' },
      { en: 'quagmire', bg: 'тресавище', cyr: 'tresavishte' },
      { en: 'boggy', bg: 'блатисто', cyr: 'blatisto' },
      { en: 'wetland', bg: 'влажна зона', cyr: 'vlazhna zona' },
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
      SELECT "order" FROM heaps WHERE "order" >= 226 AND "order" <= 250
    ` as { order: number }[]
    const existingOrderSet = new Set(existingOrders.map(r => r.order))

    const toInsert = MAP10_HEAPS.filter(h => !existingOrderSet.has(h.order))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Map 10 heaps already seeded', inserted: 0 })
    }

    const { inserted, skipped, skippedWords } = await insertHeapsDeduped(sql, toInsert, 10)

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} Map 10 heaps (${skipped} duplicate words skipped)`,
      inserted,
      skipped,
      skippedWords,
    })
  } catch (err) {
    console.error('Seed-map10 error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
