import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { insertHeapsDeduped } from '@/lib/seed'

// Map 2 — "Pirate's Passage": heaps 26–50, a canal/trade-route voyage.
const MAP2_HEAPS = [
  {
    name: 'At Home: Furniture',
    description: 'Furnish your Bulgarian home (мебели)',
    theme: 'At Home',
    order: 26,
    words: [
      { en: 'sofa', bg: 'диван', cyr: 'divan' },
      { en: 'wardrobe', bg: 'гардероб', cyr: 'garderob' },
      { en: 'shelf', bg: 'рафт', cyr: 'raft' },
      { en: 'desk', bg: 'бюро', cyr: 'byuro' },
      { en: 'armchair', bg: 'фотьойл', cyr: 'fotyoyl' },
    ],
  },
  {
    name: 'At Home: Kitchen',
    description: 'Tools of the Bulgarian kitchen (кухня)',
    theme: 'At Home',
    order: 27,
    words: [
      { en: 'plate', bg: 'чиния', cyr: 'chiniya' },
      { en: 'fork', bg: 'вилица', cyr: 'vilitsa' },
      { en: 'knife', bg: 'нож', cyr: 'nozh' },
      { en: 'spoon', bg: 'лъжица', cyr: 'lazhitsa' },
      { en: 'cup', bg: 'чаша', cyr: 'chasha' },
    ],
  },
  {
    name: 'At Home: Bathroom',
    description: 'Freshen up in Bulgarian (баня)',
    theme: 'At Home',
    order: 28,
    words: [
      { en: 'towel', bg: 'кърпа', cyr: 'karpa' },
      { en: 'soap', bg: 'сапун', cyr: 'sapun' },
      { en: 'mirror', bg: 'огледало', cyr: 'ogledalo' },
      { en: 'shower', bg: 'душ', cyr: 'dush' },
      { en: 'toothbrush', bg: 'четка за зъби', cyr: 'chetka za zabi' },
    ],
  },
  {
    name: 'Nature: Landscapes',
    description: 'The lay of the Bulgarian land (пейзажи)',
    theme: 'Nature',
    order: 29,
    words: [
      { en: 'hill', bg: 'хълм', cyr: 'halm' },
      { en: 'valley', bg: 'долина', cyr: 'dolina' },
      { en: 'field', bg: 'поле', cyr: 'pole' },
      { en: 'lake', bg: 'езеро', cyr: 'ezero' },
      { en: 'cave', bg: 'пещера', cyr: 'peshtera' },
    ],
  },
  {
    name: 'Nature: Weather',
    description: 'Stormy skies in Bulgarian (време)',
    theme: 'Nature',
    order: 30,
    words: [
      { en: 'storm', bg: 'буря', cyr: 'burya' },
      { en: 'fog', bg: 'мъгла', cyr: 'magla' },
      { en: 'lightning', bg: 'мълния', cyr: 'malniya' },
      { en: 'thunder', bg: 'гръм', cyr: 'gram' },
      { en: 'rainbow', bg: 'дъга', cyr: 'daga' },
    ],
  },
  {
    name: 'Nature: Animals',
    description: 'Creatures of the Bulgarian wild (животни)',
    theme: 'Nature',
    order: 31,
    words: [
      { en: 'bear', bg: 'мечка', cyr: 'mechka' },
      { en: 'wolf', bg: 'вълк', cyr: 'valk' },
      { en: 'fox', bg: 'лисица', cyr: 'lisitsa' },
      { en: 'rabbit', bg: 'заек', cyr: 'zaek' },
      { en: 'deer', bg: 'елен', cyr: 'elen' },
    ],
  },
  {
    name: 'Work: Office',
    description: 'Equip the Bulgarian office (офис)',
    theme: 'Work',
    order: 32,
    words: [
      { en: 'office', bg: 'офис', cyr: 'ofis' },
      { en: 'computer', bg: 'компютър', cyr: 'kompyutar' },
      { en: 'printer', bg: 'принтер', cyr: 'printer' },
      { en: 'email', bg: 'имейл', cyr: 'imeyl' },
      { en: 'document', bg: 'документ', cyr: 'dokument' },
    ],
  },
  {
    name: 'Work: Colleagues',
    description: 'The people you work with (колеги)',
    theme: 'Work',
    order: 33,
    words: [
      { en: 'boss', bg: 'шеф', cyr: 'shef' },
      { en: 'colleague', bg: 'колега', cyr: 'kolega' },
      { en: 'employee', bg: 'служител', cyr: 'sluzhitel' },
      { en: 'manager', bg: 'мениджър', cyr: 'menidzhar' },
      { en: 'team', bg: 'екип', cyr: 'ekip' },
    ],
  },
  {
    name: 'Work: Meetings',
    description: 'Get things done at work (срещи)',
    theme: 'Work',
    order: 34,
    words: [
      { en: 'meeting', bg: 'среща', cyr: 'sreshta' },
      { en: 'project', bg: 'проект', cyr: 'proekt' },
      { en: 'deadline', bg: 'краен срок', cyr: 'kraen srok' },
      { en: 'task', bg: 'задача', cyr: 'zadacha' },
      { en: 'idea', bg: 'идея', cyr: 'ideya' },
    ],
  },
  {
    name: 'Health: Body',
    description: 'Deeper anatomy in Bulgarian (тяло)',
    theme: 'Health',
    order: 35,
    words: [
      { en: 'skin', bg: 'кожа', cyr: 'kozha' },
      { en: 'bone', bg: 'кост', cyr: 'kost' },
      { en: 'blood', bg: 'кръв', cyr: 'krav' },
      { en: 'knee', bg: 'коляно', cyr: 'kolyano' },
      { en: 'shoulder', bg: 'рамо', cyr: 'ramo' },
    ],
  },
  {
    name: 'Health: Doctor',
    description: 'At the Bulgarian clinic (лекар)',
    theme: 'Health',
    order: 36,
    words: [
      { en: 'doctor', bg: 'лекар', cyr: 'lekar' },
      { en: 'nurse', bg: 'медицинска сестра', cyr: 'meditsinska sestra' },
      { en: 'patient', bg: 'пациент', cyr: 'patsient' },
      { en: 'pain', bg: 'болка', cyr: 'bolka' },
      { en: 'health', bg: 'здраве', cyr: 'zdrave' },
    ],
  },
  {
    name: 'Health: Pharmacy',
    description: 'Pick up your remedies (аптека)',
    theme: 'Health',
    order: 37,
    words: [
      { en: 'pharmacy', bg: 'аптека', cyr: 'apteka' },
      { en: 'medicine', bg: 'лекарство', cyr: 'lekarstvo' },
      { en: 'pill', bg: 'хапче', cyr: 'hapche' },
      { en: 'prescription', bg: 'рецепта', cyr: 'retsepta' },
      { en: 'bandage', bg: 'превръзка', cyr: 'prevrazka' },
    ],
  },
  {
    name: 'Shopping: Groceries',
    description: 'Stock up at the Bulgarian market (пазаруване)',
    theme: 'Shopping',
    order: 38,
    words: [
      { en: 'market', bg: 'пазар', cyr: 'pazar' },
      { en: 'bag', bg: 'чанта', cyr: 'chanta' },
      { en: 'money', bg: 'пари', cyr: 'pari' },
      { en: 'list', bg: 'списък', cyr: 'spisak' },
      { en: 'basket', bg: 'кошница', cyr: 'koshnitsa' },
    ],
  },
  {
    name: 'Shopping: Clothes',
    description: 'Refresh your wardrobe (дрехи)',
    theme: 'Shopping',
    order: 39,
    words: [
      { en: 'dress', bg: 'рокля', cyr: 'roklya' },
      { en: 'skirt', bg: 'пола', cyr: 'pola' },
      { en: 'socks', bg: 'чорапи', cyr: 'chorapi' },
      { en: 'gloves', bg: 'ръкавици', cyr: 'rakavitsi' },
      { en: 'scarf', bg: 'шал', cyr: 'shal' },
    ],
  },
  {
    name: 'Shopping: Prices',
    description: 'Talk money at the till (цени)',
    theme: 'Shopping',
    order: 40,
    words: [
      { en: 'price', bg: 'цена', cyr: 'tsena' },
      { en: 'cheap', bg: 'евтин', cyr: 'evtin' },
      { en: 'expensive', bg: 'скъп', cyr: 'skap' },
      { en: 'discount', bg: 'отстъпка', cyr: 'otstapka' },
      { en: 'receipt', bg: 'касова бележка', cyr: 'kasova belezhka' },
    ],
  },
  {
    name: 'School: Subjects',
    description: 'What you study in Bulgarian (предмети)',
    theme: 'School',
    order: 41,
    words: [
      { en: 'mathematics', bg: 'математика', cyr: 'matematika' },
      { en: 'history', bg: 'история', cyr: 'istoriya' },
      { en: 'geography', bg: 'география', cyr: 'geografiya' },
      { en: 'science', bg: 'наука', cyr: 'nauka' },
      { en: 'art', bg: 'изкуство', cyr: 'izkustvo' },
    ],
  },
  {
    name: 'School: Classroom',
    description: 'Inside the Bulgarian classroom (класна стая)',
    theme: 'School',
    order: 42,
    words: [
      { en: 'teacher', bg: 'учител', cyr: 'uchitel' },
      { en: 'student', bg: 'ученик', cyr: 'uchenik' },
      { en: 'book', bg: 'книга', cyr: 'kniga' },
      { en: 'pen', bg: 'химикал', cyr: 'himikal' },
      { en: 'notebook', bg: 'тетрадка', cyr: 'tetradka' },
    ],
  },
  {
    name: 'Hobbies: Sports',
    description: 'Get active in Bulgarian (спорт)',
    theme: 'Hobbies',
    order: 43,
    words: [
      { en: 'football', bg: 'футбол', cyr: 'futbol' },
      { en: 'swimming', bg: 'плуване', cyr: 'pluvane' },
      { en: 'running', bg: 'бягане', cyr: 'byagane' },
      { en: 'tennis', bg: 'тенис', cyr: 'tenis' },
      { en: 'ball', bg: 'топка', cyr: 'topka' },
    ],
  },
  {
    name: 'Hobbies: Music',
    description: 'Make some noise in Bulgarian (музика)',
    theme: 'Hobbies',
    order: 44,
    words: [
      { en: 'music', bg: 'музика', cyr: 'muzika' },
      { en: 'song', bg: 'песен', cyr: 'pesen' },
      { en: 'guitar', bg: 'китара', cyr: 'kitara' },
      { en: 'piano', bg: 'пиано', cyr: 'piano' },
      { en: 'singer', bg: 'певец', cyr: 'pevets' },
    ],
  },
  {
    name: 'Hobbies: Reading',
    description: 'Lose yourself in a book (четене)',
    theme: 'Hobbies',
    order: 45,
    words: [
      { en: 'story', bg: 'разказ', cyr: 'razkaz' },
      { en: 'novel', bg: 'роман', cyr: 'roman' },
      { en: 'page', bg: 'страница', cyr: 'stranitsa' },
      { en: 'author', bg: 'автор', cyr: 'avtor' },
      { en: 'library', bg: 'библиотека', cyr: 'biblioteka' },
    ],
  },
  {
    name: 'City: Streets',
    description: 'Find your way around town (улици)',
    theme: 'City',
    order: 46,
    words: [
      { en: 'square', bg: 'площад', cyr: 'ploshtad' },
      { en: 'bridge', bg: 'мост', cyr: 'most' },
      { en: 'corner', bg: 'ъгъл', cyr: 'agal' },
      { en: 'sidewalk', bg: 'тротоар', cyr: 'trotoar' },
      { en: 'crossing', bg: 'пешеходна пътека', cyr: 'peshehodna pateka' },
    ],
  },
  {
    name: 'City: Transport',
    description: 'Get around the Bulgarian city (транспорт)',
    theme: 'City',
    order: 47,
    words: [
      { en: 'car', bg: 'кола', cyr: 'kola' },
      { en: 'taxi', bg: 'такси', cyr: 'taksi' },
      { en: 'tram', bg: 'трамвай', cyr: 'tramvay' },
      { en: 'metro', bg: 'метро', cyr: 'metro' },
      { en: 'bicycle', bg: 'велосипед', cyr: 'velosiped' },
    ],
  },
  {
    name: 'City: Services',
    description: 'Public places around town (услуги)',
    theme: 'City',
    order: 48,
    words: [
      { en: 'post office', bg: 'поща', cyr: 'poshta' },
      { en: 'police', bg: 'полиция', cyr: 'politsiya' },
      { en: 'fire station', bg: 'пожарна', cyr: 'pozharna' },
      { en: 'school', bg: 'училище', cyr: 'uchilishte' },
      { en: 'church', bg: 'църква', cyr: 'tsarkva' },
    ],
  },
  {
    name: 'Family: Relatives',
    description: 'The wider Bulgarian family (роднини)',
    theme: 'Family',
    order: 49,
    words: [
      { en: 'grandmother', bg: 'баба', cyr: 'baba' },
      { en: 'grandfather', bg: 'дядо', cyr: 'dyado' },
      { en: 'aunt', bg: 'леля', cyr: 'lelya' },
      { en: 'uncle', bg: 'чичо', cyr: 'chicho' },
      { en: 'cousin', bg: 'братовчед', cyr: 'bratovched' },
    ],
  },
  {
    name: 'Family: Celebrations',
    description: 'Bulgarian festivities and feasts (празненства)',
    theme: 'Family',
    order: 50,
    words: [
      { en: 'birthday', bg: 'рожден ден', cyr: 'rozhden den' },
      { en: 'wedding', bg: 'сватба', cyr: 'svatba' },
      { en: 'holiday', bg: 'празник', cyr: 'praznik' },
      { en: 'gift', bg: 'подарък', cyr: 'podarak' },
      { en: 'guest', bg: 'гост', cyr: 'gost' },
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
      SELECT "order" FROM heaps WHERE "order" >= 26
    ` as { order: number }[]
    const existingOrderSet = new Set(existingOrders.map(r => r.order))

    const toInsert = MAP2_HEAPS.filter(h => !existingOrderSet.has(h.order))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'Map 2 heaps already seeded', inserted: 0 })
    }

    const { inserted, skipped, skippedWords } = await insertHeapsDeduped(sql, toInsert, 2)

    return NextResponse.json({
      success: true,
      message: `Seeded ${inserted} Map 2 heaps (${skipped} duplicate words skipped)`,
      inserted,
      skipped,
      skippedWords,
    })
  } catch (err) {
    console.error('Seed-map2 error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
