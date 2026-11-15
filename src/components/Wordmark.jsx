export function Wordmark({ className = '', inverse = false, decorative = false }) {
  const img = (
    <img
      src="/snug-logo.svg"
      width="685"
      height="454"
      alt=""
      aria-hidden={decorative || undefined}
      className={`snug-logo h-[1em] w-auto align-middle ${inverse ? 'invert' : ''} ${className}`}
    />
  )
  if (decorative) return img
  return (
    <span role="img" aria-label="Snug & Co." className="inline-flex">
      {img}
    </span>
  )
}
