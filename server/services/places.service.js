import axios from 'axios'

export async function getNearbyPlaces(lat, lng, type) {
  const response = await axios.get(
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    {
      params: {
        location: `${lat},${lng}`,
        radius: 5000,
        type: type,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    }
  )
  return response.data.results.slice(0, 3).map(p => ({
    name: p.name,
    address: p.vicinity,
    rating: p.rating,
    distance: calculateDistance(lat, lng,
      p.geometry.location.lat,
      p.geometry.location.lng)
  }))
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return (R * c).toFixed(1) + ' km'
}
