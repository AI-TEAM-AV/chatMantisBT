export default function NewMessagesIndicator({ visible, onJumpToLatest }) {
  if (!visible) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
      <button
        type="button"
        onClick={onJumpToLatest}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg shadow-primary-950/20 transition-colors hover:bg-primary-700"
        aria-label="Mensajes nuevos"
      >
        <span className="h-2 w-2 rounded-full bg-white" />
        Mensajes nuevos
      </button>
    </div>
  )
}