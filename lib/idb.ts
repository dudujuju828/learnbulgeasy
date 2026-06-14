// Browser-only: import only from 'use client' components or lazy imports
import type { Heap, HeapWord, UserProgress } from './types'

const DB_NAME = 'bulgeasy-pwa'
const DB_VERSION = 2
const SYNC_STORE = 'pending_sync'
const HEAPS_STORE = 'heaps'

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(SYNC_STORE)) {
        db.createObjectStore(SYNC_STORE, { keyPath: 'heap_id' })
      }
      if (!db.objectStoreNames.contains(HEAPS_STORE)) {
        db.createObjectStore(HEAPS_STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = e => resolve((e.target as IDBOpenDBRequest).result)
    req.onerror = () => {
      console.error('[idb] open failed', req.error)
      reject(req.error)
    }
  })
}

// ── Offline heap data cache ─────────────────────────────────────────────────

export interface CachedHeap {
  id: string
  heap: Heap
  progress: UserProgress | null
  nextHeapId: string | null
  unlocked: boolean
  cachedAt: number
}

/** Bulk-store all heaps (full vocab) for offline play. */
export async function seedHeaps(entries: CachedHeap[]): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HEAPS_STORE, 'readwrite')
    const store = tx.objectStore(HEAPS_STORE)
    for (const entry of entries) store.put(entry)
    tx.oncomplete = () => {
      console.log(`[idb] seeded ${entries.length} heaps for offline`)
      resolve()
    }
    tx.onerror = () => {
      console.error('[idb] seedHeaps failed', tx.error)
      reject(tx.error)
    }
  })
}

export async function getCachedHeap(heapId: string): Promise<CachedHeap | null> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(HEAPS_STORE, 'readonly').objectStore(HEAPS_STORE).get(heapId)
    req.onsuccess = () => resolve((req.result as CachedHeap) ?? null)
    req.onerror = () => {
      console.error('[idb] getCachedHeap failed', req.error)
      reject(req.error)
    }
  })
}

export async function getAllCachedHeaps(): Promise<CachedHeap[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(HEAPS_STORE, 'readonly').objectStore(HEAPS_STORE).getAll()
    req.onsuccess = () => resolve(req.result as CachedHeap[])
    req.onerror = () => reject(req.error)
  })
}

/** Merge fresh progress into a cached heap so offline replays stay consistent. */
export async function updateCachedProgress(
  heapId: string,
  data: PendingSync['data'],
): Promise<void> {
  const existing = await getCachedHeap(heapId)
  if (!existing) return
  const prev = existing.progress
  existing.progress = {
    id: prev?.id ?? '',
    user_id: prev?.user_id ?? '',
    heap_id: heapId,
    completed: data.completed || prev?.completed || false,
    loops_completed: Math.max(data.loops_completed, prev?.loops_completed ?? 0),
    last_played: new Date().toISOString(),
    total_attempts: (prev?.total_attempts ?? 0) + data.total_attempts,
    best_streak: Math.max(data.best_streak, prev?.best_streak ?? 0),
    created_at: prev?.created_at ?? new Date().toISOString(),
  }
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HEAPS_STORE, 'readwrite')
    tx.objectStore(HEAPS_STORE).put(existing)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Derive the player's unlocked dictionary words straight from the offline heap
 * cache: a heap's 5 words enter the dictionary exactly when that heap is
 * completed, so the completed cached heaps ARE the dictionary. Lets Infinite
 * Mode run fully offline without a separate dictionary store. De-duped by word.
 * Pass `mapId` to restrict to a single map's heaps (per-map Infinite Mode).
 */
export async function getDictionaryWords(mapId?: number): Promise<HeapWord[]> {
  const heaps = await getAllCachedHeaps()
  const words: HeapWord[] = []
  const seen = new Set<string>()
  for (const ch of heaps) {
    if (!ch.progress?.completed) continue
    if (mapId != null && ch.heap.map_id !== mapId) continue
    for (const w of ch.heap.words) {
      const key = `${w.en}|${w.bg}`
      if (seen.has(key)) continue
      seen.add(key)
      words.push(w)
    }
  }
  return words
}

// ── Pending progress sync queue ─────────────────────────────────────────────

export interface PendingSync {
  heap_id: string
  data: {
    loops_completed: number
    total_attempts: number
    best_streak: number
    completed: boolean
  }
}

export async function queueProgressSync(heapId: string, data: PendingSync['data']): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE, 'readwrite')
    tx.objectStore(SYNC_STORE).put({ heap_id: heapId, data })
    tx.oncomplete = () => {
      console.log(`[idb] queued progress for ${heapId}`)
      resolve()
    }
    tx.onerror = () => {
      console.error('[idb] queueProgressSync failed', tx.error)
      reject(tx.error)
    }
  })
}

export async function getPendingSync(): Promise<PendingSync[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(SYNC_STORE, 'readonly').objectStore(SYNC_STORE).getAll()
    req.onsuccess = () => resolve(req.result as PendingSync[])
    req.onerror = () => reject(req.error)
  })
}

export async function removePendingSyncItem(heapId: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE, 'readwrite')
    tx.objectStore(SYNC_STORE).delete(heapId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
