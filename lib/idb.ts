// Browser-only: import only from 'use client' components or lazy imports

const DB_NAME = 'bulgeasy-pwa'
const DB_VERSION = 1

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('pending_sync')) {
        db.createObjectStore('pending_sync', { keyPath: 'heap_id' })
      }
    }
    req.onsuccess = e => resolve((e.target as IDBOpenDBRequest).result)
    req.onerror = () => reject(req.error)
  })
}

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
    const tx = db.transaction('pending_sync', 'readwrite')
    tx.objectStore('pending_sync').put({ heap_id: heapId, data })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getPendingSync(): Promise<PendingSync[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('pending_sync', 'readonly').objectStore('pending_sync').getAll()
    req.onsuccess = () => resolve(req.result as PendingSync[])
    req.onerror = () => reject(req.error)
  })
}

export async function removePendingSyncItem(heapId: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_sync', 'readwrite')
    tx.objectStore('pending_sync').delete(heapId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
