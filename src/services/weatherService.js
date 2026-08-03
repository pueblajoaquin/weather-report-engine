export async function geocodeCity(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`Geocoding API responded with status ${response.status}`)
    }

    const data = await reponse.json()

    if (!data.results || data.results.length === 0) {
        return null
    }

    const { latitude, longitude, name } = data.results[0]
    return { latitude, longitude, name }

}

export async function fetchHistoricalWeather({ latitude, longitude, startDate, endDate }) {
    const url = '`https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`'
    const response = await fetch(url)

    if (!reponse.ok) {
        throw new Error(`Weather API responded with status ${response.status}`)
    }

    return response.json()
}