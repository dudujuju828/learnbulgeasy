import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { insertHeapsDeduped } from '@/lib/seed'

// Map 5 — "Desert & Travel": heaps 101–125, desert crossings, survival and the long road.
const MAP5_HEAPS = [
  {
    name: 'Sands: The Open Desert',
    description: 'Endless dunes in every direction (пустиня)',
    theme: 'Desert',
    order: 101,
    words: [
      { en: 'desert', bg: 'пустиня', cyr: 'pustinya' },
      { en: 'dune', bg: 'дюна', cyr: 'dyuna' },
      { en: 'oasis', bg: 'оазис', cyr: 'oazis' },
      { en: 'mirage', bg: 'мираж', cyr: 'mirazh' },
      { en: 'horizon', bg: 'хоризонт', cyr: 'horizont' },
    ],
  },
  {
    name: 'Heat: The Burning Sun',
    description: 'When the air shimmers (жега)',
    theme: 'Heat',
    order: 102,
    words: [
      { en: 'heat', bg: 'жега', cyr: 'zhega' },
      { en: 'drought', bg: 'суша', cyr: 'susha' },
      { en: 'shade', bg: 'сянка', cyr: 'syanka' },
      { en: 'thirst', bg: 'жажда', cyr: 'zhazhda' },
      { en: 'sunstroke', bg: 'слънчев удар', cyr: 'slanchev udar' },
    ],
  },
  {
    name: 'Caravan: On the Move',
    description: 'Crossing with the traders (керван)',
    theme: 'Caravan',
    order: 103,
    words: [
      { en: 'caravan', bg: 'керван', cyr: 'kervan' },
      { en: 'camel', bg: 'камила', cyr: 'kamila' },
      { en: 'saddle', bg: 'седло', cyr: 'sedlo' },
      { en: 'merchant', bg: 'търговец', cyr: 'targovets' },
      { en: 'journey', bg: 'пътуване', cyr: 'patuvane' },
    ],
  },
  {
    name: 'Creatures: The Dunes',
    description: 'Small things in the sand (същества)',
    theme: 'Creatures',
    order: 104,
    words: [
      { en: 'scorpion', bg: 'скорпион', cyr: 'skorpion' },
      { en: 'spider', bg: 'паяк', cyr: 'payak' },
      { en: 'beetle', bg: 'бръмбар', cyr: 'brambar' },
      { en: 'jackal', bg: 'чакал', cyr: 'chakal' },
      { en: 'vulture', bg: 'лешояд', cyr: 'leshoyad' },
    ],
  },
  {
    name: 'Oasis: Water Source',
    description: 'Green life around the spring (оазис)',
    theme: 'Oasis',
    order: 105,
    words: [
      { en: 'palm', bg: 'палма', cyr: 'palma' },
      { en: 'puddle', bg: 'локва', cyr: 'lokva' },
      { en: 'date', bg: 'фурма', cyr: 'furma' },
      { en: 'reed', bg: 'тръстика', cyr: 'trastika' },
      { en: 'mud', bg: 'кал', cyr: 'kal' },
    ],
  },
  {
    name: 'Wind: Storm & Stillness',
    description: 'The desert breathes (вятър)',
    theme: 'Wind',
    order: 106,
    words: [
      { en: 'sandstorm', bg: 'пясъчна буря', cyr: 'pyasachna burya' },
      { en: 'gust', bg: 'повей', cyr: 'povey' },
      { en: 'whirlwind', bg: 'вихър', cyr: 'vihar' },
      { en: 'breeze', bg: 'ветрец', cyr: 'vetrets' },
      { en: 'lull', bg: 'затишие', cyr: 'zatishie' },
    ],
  },
  {
    name: 'Survival Kit: The Essentials',
    description: 'What keeps you alive (запаси)',
    theme: 'Survival',
    order: 107,
    words: [
      { en: 'canteen', bg: 'манерка', cyr: 'manerka' },
      { en: 'waterskin', bg: 'мях', cyr: 'myah' },
      { en: 'rations', bg: 'дажби', cyr: 'dazhbi' },
      { en: 'supplies', bg: 'запаси', cyr: 'zapasi' },
      { en: 'stick', bg: 'пръчка', cyr: 'prachka' },
    ],
  },
  {
    name: 'Colors: Shades of Sand',
    description: 'Hues of the dry land (цветове)',
    theme: 'Colors',
    order: 108,
    words: [
      { en: 'beige', bg: 'бежов', cyr: 'bezhov' },
      { en: 'ochre', bg: 'охра', cyr: 'ohra' },
      { en: 'pale', bg: 'блед', cyr: 'bled' },
      { en: 'bright', bg: 'ярък', cyr: 'yarak' },
      { en: 'dark', bg: 'тъмен', cyr: 'tamen' },
    ],
  },
  {
    name: "Body: The Crossing's Toll",
    description: 'What the heat takes (тяло)',
    theme: 'Body',
    order: 109,
    words: [
      { en: 'hunger', bg: 'глад', cyr: 'glad' },
      { en: 'fatigue', bg: 'умора', cyr: 'umora' },
      { en: 'fever', bg: 'треска', cyr: 'treska' },
      { en: 'blister', bg: 'мехур', cyr: 'mehur' },
      { en: 'shiver', bg: 'тръпка', cyr: 'trapka' },
    ],
  },
  {
    name: 'Oasis: Rest & Relief',
    description: 'Shade at last (почивка)',
    theme: 'Rest',
    order: 110,
    words: [
      { en: 'nap', bg: 'дрямка', cyr: 'dryamka' },
      { en: 'comfort', bg: 'уют', cyr: 'uyut' },
      { en: 'coolness', bg: 'прохлада', cyr: 'prohlada' },
      { en: 'relief', bg: 'облекчение', cyr: 'oblekchenie' },
      { en: 'sleep', bg: 'сън', cyr: 'san' },
    ],
  },
  {
    name: 'Treasure: Trade Goods',
    description: 'Riches of the caravan (богатства)',
    theme: 'Treasure',
    order: 111,
    words: [
      { en: 'gold', bg: 'злато', cyr: 'zlato' },
      { en: 'silver', bg: 'сребро', cyr: 'srebro' },
      { en: 'gem', bg: 'самоцвет', cyr: 'samotsvet' },
      { en: 'spice', bg: 'подправка', cyr: 'podpravka' },
      { en: 'silk', bg: 'коприна', cyr: 'koprina' },
    ],
  },
  {
    name: 'Ruins: The Ancient City',
    description: 'Stones of a lost age (руини)',
    theme: 'Ruins',
    order: 112,
    words: [
      { en: 'ruins', bg: 'руини', cyr: 'ruini' },
      { en: 'temple', bg: 'храм', cyr: 'hram' },
      { en: 'pillar', bg: 'колона', cyr: 'kolona' },
      { en: 'statue', bg: 'статуя', cyr: 'statuya' },
      { en: 'tomb', bg: 'гробница', cyr: 'grobnitsa' },
    ],
  },
  {
    name: 'Nomads: People of the Sand',
    description: 'Those born to wander (номади)',
    theme: 'Nomads',
    order: 113,
    words: [
      { en: 'nomad', bg: 'номад', cyr: 'nomad' },
      { en: 'tribe', bg: 'племе', cyr: 'pleme' },
      { en: 'chief', bg: 'вожд', cyr: 'vozhd' },
      { en: 'elder', bg: 'старейшина', cyr: 'stareyshina' },
      { en: 'robe', bg: 'роба', cyr: 'roba' },
    ],
  },
  {
    name: 'Cooking Fire: The Camp Meal',
    description: 'Smoke against the dusk (огън)',
    theme: 'Cooking',
    order: 114,
    words: [
      { en: 'kettle', bg: 'чайник', cyr: 'chaynik' },
      { en: 'coal', bg: 'въглен', cyr: 'vaglen' },
      { en: 'smoke', bg: 'дим', cyr: 'dim' },
      { en: 'flame', bg: 'пламък', cyr: 'plamak' },
      { en: 'ash', bg: 'пепел', cyr: 'pepel' },
    ],
  },
  {
    name: 'Oasis: Sweet Fruits',
    description: 'The reward of green shade (плодове)',
    theme: 'Fruits',
    order: 115,
    words: [
      { en: 'fig', bg: 'смокиня', cyr: 'smokinya' },
      { en: 'pomegranate', bg: 'нар', cyr: 'nar' },
      { en: 'melon', bg: 'пъпеш', cyr: 'papesh' },
      { en: 'watermelon', bg: 'диня', cyr: 'dinya' },
      { en: 'apricot', bg: 'кайсия', cyr: 'kaysiya' },
    ],
  },
  {
    name: 'Night Sky: Desert Stars',
    description: 'A million lights overhead (нощно небе)',
    theme: 'Sky',
    order: 116,
    words: [
      { en: 'constellation', bg: 'съзвездие', cyr: 'sazvezdie' },
      { en: 'comet', bg: 'комета', cyr: 'kometa' },
      { en: 'planet', bg: 'планета', cyr: 'planeta' },
      { en: 'darkness', bg: 'тъмнина', cyr: 'tamnina' },
      { en: 'glow', bg: 'сияние', cyr: 'siyanie' },
    ],
  },
  {
    name: 'Directions: Reading the Sands',
    description: 'Which way to the water (посоки)',
    theme: 'Directions',
    order: 117,
    words: [
      { en: 'north', bg: 'север', cyr: 'sever' },
      { en: 'south', bg: 'юг', cyr: 'yug' },
      { en: 'east', bg: 'изток', cyr: 'iztok' },
      { en: 'west', bg: 'запад', cyr: 'zapad' },
      { en: 'distance', bg: 'разстояние', cyr: 'razstoyanie' },
    ],
  },
  {
    name: 'Emotions: The Long Crossing',
    description: 'The heart in the heat (чувства)',
    theme: 'Emotions',
    order: 118,
    words: [
      { en: 'despair', bg: 'отчаяние', cyr: 'otchayanie' },
      { en: 'patience', bg: 'търпение', cyr: 'tarpenie' },
      { en: 'courage', bg: 'смелост', cyr: 'smelost' },
      { en: 'doubt', bg: 'съмнение', cyr: 'samnenie' },
      { en: 'joy', bg: 'радост', cyr: 'radost' },
    ],
  },
  {
    name: 'Market Town: The Bazaar',
    description: 'Haggle at the edge of the sand (базар)',
    theme: 'Market',
    order: 119,
    words: [
      { en: 'bazaar', bg: 'базар', cyr: 'bazar' },
      { en: 'stall', bg: 'сергия', cyr: 'sergiya' },
      { en: 'scale', bg: 'везна', cyr: 'vezna' },
      { en: 'customer', bg: 'клиент', cyr: 'klient' },
      { en: 'bargain', bg: 'пазарлък', cyr: 'pazarlak' },
    ],
  },
  {
    name: 'Riding: Across the Waste',
    description: 'Verbs of the long trek (яздене)',
    theme: 'Actions',
    order: 120,
    words: [
      { en: 'to ride', bg: 'яздя', cyr: 'yazdya' },
      { en: 'to wander', bg: 'скитам', cyr: 'skitam' },
      { en: 'to seek', bg: 'диря', cyr: 'dirya' },
      { en: 'to dig', bg: 'копая', cyr: 'kopaya' },
      { en: 'to find', bg: 'намирам', cyr: 'namiram' },
    ],
  },
  {
    name: 'Shelter: Mud & Stone',
    description: 'Building against the sun (подслон)',
    theme: 'Shelter',
    order: 121,
    words: [
      { en: 'wall', bg: 'стена', cyr: 'stena' },
      { en: 'brick', bg: 'тухла', cyr: 'tuhla' },
      { en: 'beam', bg: 'греда', cyr: 'greda' },
      { en: 'arch', bg: 'арка', cyr: 'arka' },
      { en: 'floor', bg: 'под', cyr: 'pod' },
    ],
  },
  {
    name: 'Oasis: Birds of the Water',
    description: 'Wings over the green (птици)',
    theme: 'Birds',
    order: 122,
    words: [
      { en: 'dove', bg: 'гълъб', cyr: 'galab' },
      { en: 'falcon', bg: 'сокол', cyr: 'sokol' },
      { en: 'owl', bg: 'бухал', cyr: 'buhal' },
      { en: 'stork', bg: 'щъркел', cyr: 'shtarkel' },
      { en: 'sparrow', bg: 'врабче', cyr: 'vrabche' },
    ],
  },
  {
    name: 'Cool Drinks: Relief from Heat',
    description: 'Sweet and sharp on the tongue (напитки)',
    theme: 'Drinks',
    order: 123,
    words: [
      { en: 'lemonade', bg: 'лимонада', cyr: 'limonada' },
      { en: 'mint', bg: 'мента', cyr: 'menta' },
      { en: 'syrup', bg: 'сироп', cyr: 'sirop' },
      { en: 'sugar', bg: 'захар', cyr: 'zahar' },
      { en: 'lemon', bg: 'лимон', cyr: 'limon' },
    ],
  },
  {
    name: 'The Long Road: Onward',
    description: 'Tracks across the waste (път)',
    theme: 'Road',
    order: 124,
    words: [
      { en: 'road', bg: 'път', cyr: 'pat' },
      { en: 'footstep', bg: 'стъпка', cyr: 'stapka' },
      { en: 'crossroads', bg: 'кръстопът', cyr: 'krastopat' },
      { en: 'border', bg: 'граница', cyr: 'granitsa' },
      { en: 'trace', bg: 'следа', cyr: 'sleda' },
    ],
  },
  {
    name: 'Paradise Found: The Green',
    description: 'Journey’s end at the oasis (рай)',
    theme: 'Paradise',
    order: 125,
    words: [
      { en: 'paradise', bg: 'рай', cyr: 'ray' },
      { en: 'grove', bg: 'горичка', cyr: 'gorichka' },
      { en: 'blessing', bg: 'благословия', cyr: 'blagosloviya' },
      { en: 'abundance', bg: 'изобилие', cyr: 'izobilie' },
      { en: 'home', bg: 'дом', cyr: 'dom' },
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
      SELECT "order" FROM heaps WHERE "order" >= 101
    ` as { order: number }[]
    const existingOrderSet = new Set(existingOrders.map(r => r.order))

    const toInsert = MAP5_HEAPS.filter(h => !existingOrderSet.has(h.order))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Map 5 heaps already seeded', inserted: 0 })
    }

    const { inserted, skipped, skippedWords } = await insertHeapsDeduped(sql, toInsert, 5)

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} Map 5 heaps (${skipped} duplicate words skipped)`,
      inserted,
      skipped,
      skippedWords,
    })
  } catch (err) {
    console.error('Seed-map5 error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
