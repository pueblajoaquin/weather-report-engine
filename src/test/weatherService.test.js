import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchHistoricalWeather, geocodeCity } from '../services/weatherService.js'

beforeEach(() => {
    vi.restoreAllMocks()
})

describe('weatherService', () => {
    it('geocodes a city', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                results: [{ latitude: -31.42, longitude: -64.18, name: 'Córdoba' }],
            }),
        }))

        await expect(geocodeCity('Córdoba')).resolves.toEqual({
            latitude: -31.42,
            longitude: -64.18,
            name: 'Córdoba',
        })
    })

    it('returns null when the city is not found', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ results: [] }),
        }))

        await expect(geocodeCity('Nowhere')).resolves.toBeNull()
    })

    it('fetches historical weather', async () => {
        const responseJson = { daily: { time: ['2024-01-01'] } }

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => responseJson,
        }))

        await expect(
            fetchHistoricalWeather({
                latitude: -31.42,
                longitude: -64.18,
                startDate: '2024-01-01',
                endDate: '2024-01-07',
            })
        ).resolves.toEqual(responseJson)
    })
})