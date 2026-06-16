import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { insertHeapsDeduped } from '@/lib/seed'

// Map 7 — "Forest & Magic": heaps 151–175, woods, creatures and a world of fantasy.
const MAP7_HEAPS = [
  {
    name: 'The Woods: Deep Green',
    description: 'Into the tangled trees (гора)',
    theme: 'Forest',
    order: 151,
    words: [
      { en: 'thicket', bg: 'гъсталак', cyr: 'gastalak' },
      { en: 'clearing', bg: 'поляна', cyr: 'polyana' },
      { en: 'canopy', bg: 'корона', cyr: 'korona' },
      { en: 'hollow', bg: 'хралупа', cyr: 'hralupa' },
      { en: 'glade', bg: 'просека', cyr: 'proseka' },
    ],
  },
  {
    name: 'Magic: Spells & Charms',
    description: 'The first words of power (магия)',
    theme: 'Magic',
    order: 152,
    words: [
      { en: 'magic', bg: 'магия', cyr: 'magiya' },
      { en: 'spell', bg: 'заклинание', cyr: 'zaklinanie' },
      { en: 'potion', bg: 'отвара', cyr: 'otvara' },
      { en: 'curse', bg: 'проклятие', cyr: 'proklyatie' },
      { en: 'charm', bg: 'талисман', cyr: 'talisman' },
    ],
  },
  {
    name: 'Folk: The Little People',
    description: 'Who lives among the roots (същества)',
    theme: 'Creatures',
    order: 153,
    words: [
      { en: 'fairy', bg: 'фея', cyr: 'feya' },
      { en: 'elf', bg: 'елф', cyr: 'elf' },
      { en: 'dwarf', bg: 'джудже', cyr: 'dzhudzhe' },
      { en: 'giant', bg: 'великан', cyr: 'velikan' },
      { en: 'witch', bg: 'вещица', cyr: 'veshtitsa' },
    ],
  },
  {
    name: 'Beasts: The Legends',
    description: 'Monsters of the old tales (зверове)',
    theme: 'Creatures',
    order: 154,
    words: [
      { en: 'dragon', bg: 'дракон', cyr: 'drakon' },
      { en: 'unicorn', bg: 'еднорог', cyr: 'ednorog' },
      { en: 'troll', bg: 'трол', cyr: 'trol' },
      { en: 'goblin', bg: 'гоблин', cyr: 'goblin' },
      { en: 'griffin', bg: 'грифон', cyr: 'grifon' },
    ],
  },
  {
    name: 'Ancient Trees: The Elders',
    description: 'Trees that remember (дървета)',
    theme: 'Trees',
    order: 155,
    words: [
      { en: 'oak', bg: 'дъб', cyr: 'dab' },
      { en: 'birch', bg: 'бреза', cyr: 'breza' },
      { en: 'willow', bg: 'върба', cyr: 'varba' },
      { en: 'maple', bg: 'клен', cyr: 'klen' },
      { en: 'beech', bg: 'бук', cyr: 'buk' },
    ],
  },
  {
    name: 'Forest Floor: Small Things',
    description: 'Underfoot in the green (земя)',
    theme: 'Nature',
    order: 156,
    words: [
      { en: 'acorn', bg: 'жълъд', cyr: 'zhalad' },
      { en: 'cone', bg: 'шишарка', cyr: 'shisharka' },
      { en: 'twig', bg: 'клонка', cyr: 'klonka' },
      { en: 'pebble', bg: 'камъче', cyr: 'kamache' },
      { en: 'vine', bg: 'лиана', cyr: 'liana' },
    ],
  },
  {
    name: 'Night Animals: After Dark',
    description: 'Eyes that shine at night (нощни животни)',
    theme: 'Wildlife',
    order: 157,
    words: [
      { en: 'bat', bg: 'прилеп', cyr: 'prilep' },
      { en: 'hedgehog', bg: 'таралеж', cyr: 'taralezh' },
      { en: 'badger', bg: 'язовец', cyr: 'yazovets' },
      { en: 'mole', bg: 'къртица', cyr: 'kartitsa' },
      { en: 'firefly', bg: 'светулка', cyr: 'svetulka' },
    ],
  },
  {
    name: 'Day Animals: In the Light',
    description: 'Quick among the branches (животни)',
    theme: 'Wildlife',
    order: 158,
    words: [
      { en: 'squirrel', bg: 'катерица', cyr: 'katerica' },
      { en: 'fawn', bg: 'сърне', cyr: 'sarne' },
      { en: 'weasel', bg: 'невестулка', cyr: 'nevestulka' },
      { en: 'woodpecker', bg: 'кълвач', cyr: 'kalvach' },
      { en: 'robin', bg: 'червеношийка', cyr: 'chervenoshiyka' },
    ],
  },
  {
    name: 'Magic Light: Glow & Spark',
    description: 'The forest shines at dusk (светлина)',
    theme: 'Magic',
    order: 159,
    words: [
      { en: 'spark', bg: 'искра', cyr: 'iskra' },
      { en: 'shimmer', bg: 'блясък', cyr: 'blyasak' },
      { en: 'halo', bg: 'ореол', cyr: 'oreol' },
      { en: 'ray', bg: 'лъч', cyr: 'lach' },
      { en: 'flicker', bg: 'трепкане', cyr: 'trepkane' },
    ],
  },
  {
    name: 'Paths: Through the Trees',
    description: 'Which way leads home (пътеки)',
    theme: 'Paths',
    order: 160,
    words: [
      { en: 'footbridge', bg: 'мостче', cyr: 'mostche' },
      { en: 'fork', bg: 'разклон', cyr: 'razklon' },
      { en: 'tunnel', bg: 'тунел', cyr: 'tunel' },
      { en: 'maze', bg: 'лабиринт', cyr: 'labirint' },
      { en: 'signpost', bg: 'пътеуказател', cyr: 'pateukazatel' },
    ],
  },
  {
    name: 'The Wizard: Master of Magic',
    description: 'The keeper of the woods (магьосник)',
    theme: 'Magic',
    order: 161,
    words: [
      { en: 'wizard', bg: 'магьосник', cyr: 'magyosnik' },
      { en: 'sorceress', bg: 'магьосница', cyr: 'magyosnitsa' },
      { en: 'scroll', bg: 'свитък', cyr: 'svitak' },
      { en: 'staff', bg: 'жезъл', cyr: 'zhezal' },
      { en: 'cloak', bg: 'наметало', cyr: 'nametalo' },
    ],
  },
  {
    name: 'Streams: Hidden Waters',
    description: 'Silver threads in the green (потоци)',
    theme: 'Water',
    order: 162,
    words: [
      { en: 'brook', bg: 'ручей', cyr: 'ruchey' },
      { en: 'marsh', bg: 'мочурище', cyr: 'mochurishte' },
      { en: 'ford', bg: 'брод', cyr: 'brod' },
      { en: 'ripple', bg: 'вълничка', cyr: 'valnichka' },
      { en: 'dew', bg: 'роса', cyr: 'rosa' },
    ],
  },
  {
    name: 'Potions: Brew & Bane',
    description: 'What bubbles in the pot (отвари)',
    theme: 'Magic',
    order: 163,
    words: [
      { en: 'elixir', bg: 'еликсир', cyr: 'eliksir' },
      { en: 'cauldron', bg: 'котел', cyr: 'kotel' },
      { en: 'extract', bg: 'екстракт', cyr: 'ekstrakt' },
      { en: 'venom', bg: 'отрова', cyr: 'otrova' },
      { en: 'antidote', bg: 'противоотрова', cyr: 'protivootrova' },
    ],
  },
  {
    name: 'Fungi: The Strange Caps',
    description: 'What grows in the damp dark (гъби)',
    theme: 'Nature',
    order: 164,
    words: [
      { en: 'toadstool', bg: 'мухоморка', cyr: 'muhomorka' },
      { en: 'truffle', bg: 'трюфел', cyr: 'tryufel' },
      { en: 'spore', bg: 'спора', cyr: 'spora' },
      { en: 'mold', bg: 'плесен', cyr: 'plesen' },
      { en: 'cap', bg: 'гугла', cyr: 'gugla' },
    ],
  },
  {
    name: 'Enchantment: Fate & Illusion',
    description: 'The spell upon the land (омая)',
    theme: 'Magic',
    order: 165,
    words: [
      { en: 'enchantment', bg: 'омая', cyr: 'omaya' },
      { en: 'illusion', bg: 'илюзия', cyr: 'ilyuziya' },
      { en: 'prophecy', bg: 'пророчество', cyr: 'prorochestvo' },
      { en: 'destiny', bg: 'съдба', cyr: 'sadba' },
      { en: 'riddle', bg: 'гатанка', cyr: 'gatanka' },
    ],
  },
  {
    name: 'The Old King: His Court',
    description: 'A ruined throne in the trees (крал)',
    theme: 'Kingdom',
    order: 166,
    words: [
      { en: 'throne', bg: 'трон', cyr: 'tron' },
      { en: 'castle', bg: 'замък', cyr: 'zamak' },
      { en: 'knight', bg: 'рицар', cyr: 'ritsar' },
      { en: 'sword', bg: 'меч', cyr: 'mech' },
      { en: 'shield', bg: 'щит', cyr: 'shtit' },
    ],
  },
  {
    name: 'Hidden Folk: Spirits',
    description: 'Shapes between the trunks (духове)',
    theme: 'Creatures',
    order: 167,
    words: [
      { en: 'gnome', bg: 'гном', cyr: 'gnom' },
      { en: 'nymph', bg: 'нимфа', cyr: 'nimfa' },
      { en: 'spirit', bg: 'дух', cyr: 'duh' },
      { en: 'ghost', bg: 'призрак', cyr: 'prizrak' },
      { en: 'phantom', bg: 'привидение', cyr: 'prividenie' },
    ],
  },
  {
    name: 'Treasure Hunt: The Hoard',
    description: 'What the dragon guards (съкровище)',
    theme: 'Treasure',
    order: 168,
    words: [
      { en: 'treasure', bg: 'съкровище', cyr: 'sakrovishte' },
      { en: 'chest', bg: 'сандък', cyr: 'sandak' },
      { en: 'lock', bg: 'катинар', cyr: 'katinar' },
      { en: 'ring', bg: 'пръстен', cyr: 'prasten' },
      { en: 'amulet', bg: 'амулет', cyr: 'amulet' },
    ],
  },
  {
    name: 'Words of Power: The Casting',
    description: 'Verbs that bend the world (заклинания)',
    theme: 'Actions',
    order: 169,
    words: [
      { en: 'to enchant', bg: 'омагьосвам', cyr: 'omagyosvam' },
      { en: 'to vanish', bg: 'изчезвам', cyr: 'izchezvam' },
      { en: 'to appear', bg: 'появявам се', cyr: 'poyavyavam se' },
      { en: 'to whisper', bg: 'шепна', cyr: 'shepna' },
      { en: 'to glow', bg: 'светя', cyr: 'svetya' },
    ],
  },
  {
    name: 'Colors: Hues of Magic',
    description: 'The glowing palette (цветове)',
    theme: 'Colors',
    order: 170,
    words: [
      { en: 'emerald', bg: 'изумруден', cyr: 'izumruden' },
      { en: 'violet', bg: 'виолетов', cyr: 'violetov' },
      { en: 'crimson', bg: 'пурпурен', cyr: 'purpuren' },
      { en: 'silvery', bg: 'сребрист', cyr: 'srebrist' },
      { en: 'glowing', bg: 'светещ', cyr: 'svetesht' },
    ],
  },
  {
    name: 'Sounds: The Forest Whispers',
    description: 'Listen between the leaves (звуци)',
    theme: 'Sounds',
    order: 171,
    words: [
      { en: 'rustle', bg: 'шумолене', cyr: 'shumolene' },
      { en: 'chirp', bg: 'чуруликане', cyr: 'churulikane' },
      { en: 'hoot', bg: 'бухане', cyr: 'buhane' },
      { en: 'snap', bg: 'прашене', cyr: 'prashene' },
      { en: 'murmur', bg: 'ромон', cyr: 'romon' },
    ],
  },
  {
    name: 'Fate: Time & Legend',
    description: 'Older than the oldest tree (съдба)',
    theme: 'Time',
    order: 172,
    words: [
      { en: 'eternity', bg: 'вечност', cyr: 'vechnost' },
      { en: 'omen', bg: 'поличба', cyr: 'polichba' },
      { en: 'age', bg: 'епоха', cyr: 'epoha' },
      { en: 'legend', bg: 'легенда', cyr: 'legenda' },
      { en: 'myth', bg: 'мит', cyr: 'mit' },
    ],
  },
  {
    name: 'Wonder: Feelings of Magic',
    description: 'The heart in an enchanted place (чувства)',
    theme: 'Feelings',
    order: 173,
    words: [
      { en: 'enchanted', bg: 'омаян', cyr: 'omayan' },
      { en: 'curious', bg: 'любопитен', cyr: 'lyubopiten' },
      { en: 'amazed', bg: 'изумен', cyr: 'izumen' },
      { en: 'uneasy', bg: 'неспокоен', cyr: 'nespokoen' },
      { en: 'joyful', bg: 'ликуващ', cyr: 'likuvasht' },
    ],
  },
  {
    name: 'The Feast: At the Long Table',
    description: 'A banquet in the glade (пир)',
    theme: 'Food',
    order: 174,
    words: [
      { en: 'banquet', bg: 'пир', cyr: 'pir' },
      { en: 'goblet', bg: 'бокал', cyr: 'bokal' },
      { en: 'mead', bg: 'медовина', cyr: 'medovina' },
      { en: 'roast', bg: 'печено', cyr: 'pecheno' },
      { en: 'pie', bg: 'пай', cyr: 'pay' },
    ],
  },
  {
    name: 'The Spell Breaks: Free at Last',
    description: 'Dawn returns to the woods (свобода)',
    theme: 'Resolution',
    order: 175,
    words: [
      { en: 'freedom', bg: 'свобода', cyr: 'svoboda' },
      { en: 'awakening', bg: 'пробуждане', cyr: 'probuzhdane' },
      { en: 'miracle', bg: 'чудо', cyr: 'chudo' },
      { en: 'wish', bg: 'желание', cyr: 'zhelanie' },
      { en: 'release', bg: 'избавление', cyr: 'izbavlenie' },
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
      SELECT "order" FROM heaps WHERE "order" >= 151
    ` as { order: number }[]
    const existingOrderSet = new Set(existingOrders.map(r => r.order))

    const toInsert = MAP7_HEAPS.filter(h => !existingOrderSet.has(h.order))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Map 7 heaps already seeded', inserted: 0 })
    }

    const { inserted, skipped, skippedWords } = await insertHeapsDeduped(sql, toInsert, 7)

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} Map 7 heaps (${skipped} duplicate words skipped)`,
      inserted,
      skipped,
      skippedWords,
    })
  } catch (err) {
    console.error('Seed-map7 error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
