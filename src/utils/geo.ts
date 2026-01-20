export function distanceInMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000 // meters
  const dLat = degToRad(b.lat - a.lat)
  const dLon = degToRad(b.lng - a.lng)
  const lat1 = degToRad(a.lat)
  const lat2 = degToRad(b.lat)

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return Math.round(R * c)
}

export function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(timestamp)
}

function degToRad(value: number) {
  return (value * Math.PI) / 180
}
