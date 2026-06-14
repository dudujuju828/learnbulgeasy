export default function DictionaryPage() {
  return (
    <div className="flex flex-col items-center px-4 py-8 gap-4">
      <div className="text-6xl">📖</div>
      <h1 className="text-2xl font-bold text-blue-900">Your Dictionary</h1>
      <p className="text-sm text-gray-500 text-center">
        Words you&apos;ve unlocked will appear here after completing heaps.
      </p>
      <div className="w-full bg-white rounded-2xl shadow-md p-6 text-center border border-blue-100">
        <p className="text-gray-400 text-sm">No words unlocked yet. Complete a heap to add words!</p>
      </div>
    </div>
  )
}
