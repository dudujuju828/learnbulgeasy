import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { insertHeapsDeduped } from '@/lib/seed'

// Map 8 — "Caves & Gems": heaps 176–200, caverns, minerals and glittering gemstones.
const MAP8_HEAPS = [
  {
    name: 'Caverns: The Entrance',
    description: 'Down into the dark (подземие)',
    theme: 'Caverns',
    order: 176,
    words: [
      { en: 'underground', bg: 'подземие', cyr: 'podzemie' },
      { en: 'entrance', bg: 'вход', cyr: 'vhod' },
      { en: 'depths', bg: 'недра', cyr: 'nedra' },
      { en: 'gallery', bg: 'галерия', cyr: 'galeriya' },
      { en: 'abyss', bg: 'бездна', cyr: 'bezdna' },
    ],
  },
  {
    name: 'Gemstones: The Bright Jewels',
    description: 'Light caught in stone (скъпоценни камъни)',
    theme: 'Crystals',
    order: 177,
    words: [
      { en: 'crystal', bg: 'кристал', cyr: 'kristal' },
      { en: 'diamond', bg: 'диамант', cyr: 'diamant' },
      { en: 'ruby', bg: 'рубин', cyr: 'rubin' },
      { en: 'sapphire', bg: 'сапфир', cyr: 'safir' },
      { en: 'emerald', bg: 'изумруд', cyr: 'izumrud' },
    ],
  },
  {
    name: 'Gemstones: Rarer Still',
    description: 'Stones of every hue (камъни)',
    theme: 'Crystals',
    order: 178,
    words: [
      { en: 'amethyst', bg: 'аметист', cyr: 'ametist' },
      { en: 'topaz', bg: 'топаз', cyr: 'topaz' },
      { en: 'opal', bg: 'опал', cyr: 'opal' },
      { en: 'quartz', bg: 'кварц', cyr: 'kvarts' },
      { en: 'pearl', bg: 'перла', cyr: 'perla' },
    ],
  },
  {
    name: 'Formations: Stone Shapes',
    description: 'Carved by water and time (образувания)',
    theme: 'Cave',
    order: 179,
    words: [
      { en: 'stalactite', bg: 'сталактит', cyr: 'stalaktit' },
      { en: 'stalagmite', bg: 'сталагмит', cyr: 'stalagmit' },
      { en: 'vault', bg: 'свод', cyr: 'svod' },
      { en: 'chamber', bg: 'зала', cyr: 'zala' },
      { en: 'pit', bg: 'яма', cyr: 'yama' },
    ],
  },
  {
    name: 'Minerals: From the Rock',
    description: 'Metals in the stone (минерали)',
    theme: 'Minerals',
    order: 180,
    words: [
      { en: 'ore', bg: 'руда', cyr: 'ruda' },
      { en: 'iron', bg: 'желязо', cyr: 'zhelyazo' },
      { en: 'bronze', bg: 'бронз', cyr: 'bronz' },
      { en: 'marble', bg: 'мрамор', cyr: 'mramor' },
      { en: 'sulfur', bg: 'сяра', cyr: 'syara' },
    ],
  },
  {
    name: 'Light: Glow in the Dark',
    description: 'A flame against the black (светлина)',
    theme: 'Light',
    order: 181,
    words: [
      { en: 'torch', bg: 'факла', cyr: 'fakla' },
      { en: 'candle', bg: 'свещ', cyr: 'svesht' },
      { en: 'gleam', bg: 'блещукане', cyr: 'bleshtukane' },
      { en: 'reflection', bg: 'отражение', cyr: 'otrazhenie' },
      { en: 'glitter', bg: 'искрене', cyr: 'iskrene' },
    ],
  },
  {
    name: 'Underground Water: The Dark Pools',
    description: 'Black mirrors below (вода)',
    theme: 'Water',
    order: 182,
    words: [
      { en: 'underground lake', bg: 'подземно езеро', cyr: 'podzemno ezero' },
      { en: 'drop', bg: 'капка', cyr: 'kapka' },
      { en: 'basin', bg: 'басейн', cyr: 'basein' },
      { en: 'channel', bg: 'канал', cyr: 'kanal' },
      { en: 'whirlpool', bg: 'водовъртеж', cyr: 'vodovartezh' },
    ],
  },
  {
    name: 'Cave Creatures: Pale & Blind',
    description: 'Life with no need of light (същества)',
    theme: 'Wildlife',
    order: 183,
    words: [
      { en: 'salamander', bg: 'саламандър', cyr: 'salamandar' },
      { en: 'centipede', bg: 'стоножка', cyr: 'stonozhka' },
      { en: 'cricket', bg: 'щурец', cyr: 'shturets' },
      { en: 'moth', bg: 'молец', cyr: 'molets' },
      { en: 'slug', bg: 'плужек', cyr: 'pluzhek' },
    ],
  },
  {
    name: 'Crystals: How They Look',
    description: 'Describe the gem (свойства)',
    theme: 'Properties',
    order: 184,
    words: [
      { en: 'clear', bg: 'бистър', cyr: 'bistar' },
      { en: 'hard', bg: 'твърд', cyr: 'tvard' },
      { en: 'rough', bg: 'грапав', cyr: 'grapav' },
      { en: 'polished', bg: 'полиран', cyr: 'poliran' },
      { en: 'rare', bg: 'рядък', cyr: 'ryadak' },
    ],
  },
  {
    name: "Miner's Tools: The Kit",
    description: 'What breaks the rock (инструменти)',
    theme: 'Tools',
    order: 185,
    words: [
      { en: 'pickaxe', bg: 'кирка', cyr: 'kirka' },
      { en: 'chisel', bg: 'длето', cyr: 'dleto' },
      { en: 'headlamp', bg: 'челник', cyr: 'chelnik' },
      { en: 'cart', bg: 'количка', cyr: 'kolichka' },
      { en: 'bucket', bg: 'кофа', cyr: 'kofa' },
    ],
  },
  {
    name: 'The Mine: Deep Works',
    description: 'Shafts into the dark (мина)',
    theme: 'Mine',
    order: 186,
    words: [
      { en: 'mine', bg: 'мина', cyr: 'mina' },
      { en: 'shaft', bg: 'шахта', cyr: 'shahta' },
      { en: 'vein', bg: 'жила', cyr: 'zhila' },
      { en: 'level', bg: 'ниво', cyr: 'nivo' },
      { en: 'support', bg: 'подпора', cyr: 'podpora' },
    ],
  },
  {
    name: 'Crystals: Shades & Tints',
    description: 'Colors locked in stone (цветове)',
    theme: 'Colors',
    order: 187,
    words: [
      { en: 'translucent', bg: 'полупрозрачен', cyr: 'poluprozrachen' },
      { en: 'iridescent', bg: 'преливащ', cyr: 'prelivasht' },
      { en: 'milky', bg: 'млечен', cyr: 'mlechen' },
      { en: 'inky', bg: 'мастилен', cyr: 'mastilen' },
      { en: 'rosy', bg: 'розов', cyr: 'rozov' },
    ],
  },
  {
    name: 'Sounds: Echoes Below',
    description: 'Noise in the hollow dark (звуци)',
    theme: 'Sounds',
    order: 188,
    words: [
      { en: 'dripping', bg: 'капене', cyr: 'kapene' },
      { en: 'hum', bg: 'бучене', cyr: 'buchene' },
      { en: 'creak', bg: 'скърцане', cyr: 'skartsane' },
      { en: 'clang', bg: 'звън', cyr: 'zvan' },
      { en: 'reverberation', bg: 'еклене', cyr: 'eklene' },
    ],
  },
  {
    name: 'Air: The Cave Atmosphere',
    description: 'Damp and heavy below (въздух)',
    theme: 'Atmosphere',
    order: 189,
    words: [
      { en: 'damp', bg: 'влага', cyr: 'vlaga' },
      { en: 'mustiness', bg: 'мухъл', cyr: 'muhal' },
      { en: 'chill', bg: 'хлад', cyr: 'hlad' },
      { en: 'vapor', bg: 'пара', cyr: 'para' },
      { en: 'stench', bg: 'воня', cyr: 'vonya' },
    ],
  },
  {
    name: 'Crystals: Hidden Power',
    description: 'The hum of the deep stone (сила)',
    theme: 'Magic',
    order: 190,
    words: [
      { en: 'energy', bg: 'енергия', cyr: 'energiya' },
      { en: 'might', bg: 'мощ', cyr: 'mosht' },
      { en: 'aura', bg: 'аура', cyr: 'aura' },
      { en: 'vibration', bg: 'вибрация', cyr: 'vibratsiya' },
      { en: 'pulse', bg: 'пулс', cyr: 'puls' },
    ],
  },
  {
    name: 'Dangers: The Dark Holds',
    description: 'Where one wrong step ends (опасности)',
    theme: 'Danger',
    order: 191,
    words: [
      { en: 'trap', bg: 'капан', cyr: 'kapan' },
      { en: 'chasm', bg: 'пропаст', cyr: 'propast' },
      { en: 'collapse', bg: 'срутване', cyr: 'srutvane' },
      { en: 'gas', bg: 'газ', cyr: 'gaz' },
      { en: 'flood', bg: 'наводнение', cyr: 'navodnenie' },
    ],
  },
  {
    name: 'Underground Plants: Pale Growth',
    description: 'Life without the sun (растения)',
    theme: 'Plants',
    order: 192,
    words: [
      { en: 'algae', bg: 'водорасли', cyr: 'vodorasli' },
      { en: 'tendril', bg: 'пипало', cyr: 'pipalo' },
      { en: 'sprout', bg: 'кълн', cyr: 'kaln' },
      { en: 'bloom', bg: 'цъфтеж', cyr: 'tsaftezh' },
      { en: 'pollen', bg: 'прашец', cyr: 'prashets' },
    ],
  },
  {
    name: 'Mining: The Hard Work',
    description: 'Verbs of the deep dig (действия)',
    theme: 'Actions',
    order: 193,
    words: [
      { en: 'to mine', bg: 'добивам', cyr: 'dobivam' },
      { en: 'to carve', bg: 'дълбая', cyr: 'dalbaya' },
      { en: 'to crawl', bg: 'пълзя', cyr: 'palzya' },
      { en: 'to shine', bg: 'блестя', cyr: 'blestya' },
      { en: 'to explore', bg: 'изследвам', cyr: 'izsledvam' },
    ],
  },
  {
    name: 'The Forge: Fire & Iron',
    description: 'Where ore becomes blade (ковачница)',
    theme: 'Forge',
    order: 194,
    words: [
      { en: 'forge', bg: 'ковачница', cyr: 'kovachnitsa' },
      { en: 'anvil', bg: 'наковалня', cyr: 'nakovalnya' },
      { en: 'furnace', bg: 'пещ', cyr: 'pesht' },
      { en: 'tongs', bg: 'клещи', cyr: 'kleshti' },
      { en: 'smith', bg: 'ковач', cyr: 'kovach' },
    ],
  },
  {
    name: 'Wayfinding: The Cave Map',
    description: 'Mark the route back (ориентири)',
    theme: 'Navigation',
    order: 195,
    words: [
      { en: 'landmark', bg: 'ориентир', cyr: 'orientir' },
      { en: 'boundary', bg: 'предел', cyr: 'predel' },
      { en: 'niche', bg: 'ниша', cyr: 'nisha' },
      { en: 'recess', bg: 'вдлъбнатина', cyr: 'vdlabnatina' },
      { en: 'opening', bg: 'отвор', cyr: 'otvor' },
    ],
  },
  {
    name: 'Value: Worth a Fortune',
    description: 'What the gems are worth (стойност)',
    theme: 'Trade',
    order: 196,
    words: [
      { en: 'value', bg: 'стойност', cyr: 'stoynost' },
      { en: 'fortune', bg: 'богатство', cyr: 'bogatstvo' },
      { en: 'weight', bg: 'тегло', cyr: 'teglo' },
      { en: 'auction', bg: 'търг', cyr: 'targ' },
      { en: 'carat', bg: 'карат', cyr: 'karat' },
    ],
  },
  {
    name: 'Feelings: In the Dark',
    description: 'The heart far underground (чувства)',
    theme: 'Feelings',
    order: 197,
    words: [
      { en: 'dread', bg: 'ужас', cyr: 'uzhas' },
      { en: 'greed', bg: 'алчност', cyr: 'alchnost' },
      { en: 'anxiety', bg: 'тревога', cyr: 'trevoga' },
      { en: 'fascination', bg: 'захлас', cyr: 'zahlas' },
      { en: 'nerve', bg: 'кураж', cyr: 'kurazh' },
    ],
  },
  {
    name: 'The Deepest Hall: The Grotto',
    description: 'A cathedral of stone (грота)',
    theme: 'Cave',
    order: 198,
    words: [
      { en: 'grotto', bg: 'грота', cyr: 'grota' },
      { en: 'dome', bg: 'купол', cyr: 'kupol' },
      { en: 'ledge', bg: 'перваз', cyr: 'pervaz' },
      { en: 'crevice', bg: 'цепнатина', cyr: 'tsepnatina' },
      { en: 'bottom', bg: 'дъно', cyr: 'dano' },
    ],
  },
  {
    name: 'The Great Find: The Mother Lode',
    description: 'A vein of pure light (находище)',
    theme: 'Discovery',
    order: 199,
    words: [
      { en: 'deposit', bg: 'находище', cyr: 'nahodishte' },
      { en: 'nugget', bg: 'късче', cyr: 'kasche' },
      { en: 'geode', bg: 'геода', cyr: 'geoda' },
      { en: 'cluster', bg: 'струпване', cyr: 'strupvane' },
      { en: 'prize', bg: 'награда', cyr: 'nagrada' },
    ],
  },
  {
    name: 'Back to Daylight: The Surface',
    description: 'Up into the sun again (изход)',
    theme: 'Resolution',
    order: 200,
    words: [
      { en: 'exit', bg: 'изход', cyr: 'izhod' },
      { en: 'daylight', bg: 'дневна светлина', cyr: 'dnevna svetlina' },
      { en: 'fresh air', bg: 'свеж въздух', cyr: 'svezh vazduh' },
      { en: 'surface', bg: 'повърхност', cyr: 'povarhnost' },
      { en: 'sunlight', bg: 'слънчева светлина', cyr: 'slancheva svetlina' },
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
      SELECT "order" FROM heaps WHERE "order" >= 176 AND "order" <= 200
    ` as { order: number }[]
    const existingOrderSet = new Set(existingOrders.map(r => r.order))

    const toInsert = MAP8_HEAPS.filter(h => !existingOrderSet.has(h.order))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Map 8 heaps already seeded', inserted: 0 })
    }

    const { inserted, skipped, skippedWords } = await insertHeapsDeduped(sql, toInsert, 8)

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} Map 8 heaps (${skipped} duplicate words skipped)`,
      inserted,
      skipped,
      skippedWords,
    })
  } catch (err) {
    console.error('Seed-map8 error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
