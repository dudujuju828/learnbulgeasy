export interface User {
  id: string
  email: string
  created_at: string
}

export interface HeapWord {
  en: string
  bg: string
  cyr?: string  // Latin transliteration (e.g., "hlyab" for "хляб")
}

export interface Heap {
  id: string
  name: string
  description: string | null
  theme: string
  order: number
  map_id: number
  words: HeapWord[]
  created_at: string
}

export interface GameMap {
  id: number
  name: string
  theme: string
  order_index: number
  description: string | null
  created_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  heap_id: string
  completed: boolean
  loops_completed: number
  last_played: string | null
  total_attempts: number
  best_streak: number
  created_at: string
}

export interface DictionaryEntry {
  id: string
  user_id: string
  heap_id: string
  words: HeapWord[]
  unlocked_at: string
}

export interface Session {
  userId: string
}
