import { beforeEach, describe, expect, it, vi } from 'vitest'

import reportServiceMock from '../__mocks__/reportService.js'

const weatherServiceMock = vi.hoisted(() => ({
    geocodeCity: vi.fn(),
    fetchHistoricalWeather: vi.fn(),
}))

const csvServiceMock = vi.hoisted(() => ({
    generateCsv: vi.fn(),
}))

vi.mock('../services/reportService.js', () => reportServiceMock)
vi.mock('../services/weatherService.js', () => weatherServiceMock)
vi.mock('../services/csvService.js', () => csvServiceMock)

import reportProcessor from '../workers/reportProcessor.js'

beforeEach(() => {
    vi.clearAllMocks()
})

describe('reportProcessor', () => {
    it('fails unrecoverably when the report does not exist', async () => {
        reportServiceMock.getReportByIdService.mockResolvedValue(null)

        await expect(reportProcessor({ data: { reportId: 'missing' } })).rejects.toMatchObject({
            message: 'Report missing not found',
        })
    })

    it('marks the report as failed when the city cannot be resolved', async () => {
        reportServiceMock.getReportByIdService.mockResolvedValue({
            id: 'report-1',
            city: 'Unknown City',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-07'),
        })
        weatherServiceMock.geocodeCity.mockResolvedValue(null)

        await expect(reportProcessor({ data: { reportId: 'report-1' } })).rejects.toMatchObject({
            message: 'City "Unknown City" could not be resolved',
        })

        expect(reportServiceMock.markFailedService).toHaveBeenCalledWith(
            'report-1',
            'City "Unknown City" could not be resolved'
        )
    })

    it('processes weather and completes the report', async () => {
        reportServiceMock.getReportByIdService.mockResolvedValue({
            id: 'report-1',
            city: 'Córdoba',
            startDate: new Date('2024-01-01T00:00:00.000Z'),
            endDate: new Date('2024-01-07T00:00:00.000Z'),
        })
        weatherServiceMock.geocodeCity.mockResolvedValue({ latitude: -31.42, longitude: -64.18, name: 'Córdoba' })
        weatherServiceMock.fetchHistoricalWeather.mockResolvedValue({ daily: { time: [] } })
        csvServiceMock.generateCsv.mockResolvedValue('reports/report-1.csv')

        await reportProcessor({ data: { reportId: 'report-1' } })

        expect(reportServiceMock.markProcessingService).toHaveBeenCalledWith('report-1')
        expect(weatherServiceMock.fetchHistoricalWeather).toHaveBeenCalledWith({
            latitude: -31.42,
            longitude: -64.18,
            startDate: '2024-01-01',
            endDate: '2024-01-07',
        })
        expect(csvServiceMock.generateCsv).toHaveBeenCalledWith('report-1', { daily: { time: [] } })
        expect(reportServiceMock.markCompletedService).toHaveBeenCalledWith('report-1', 'reports/report-1.csv')
    })

    it('stores the error message when weather fetching fails', async () => {
        reportServiceMock.getReportByIdService.mockResolvedValue({
            id: 'report-1',
            city: 'Córdoba',
            startDate: new Date('2024-01-01T00:00:00.000Z'),
            endDate: new Date('2024-01-07T00:00:00.000Z'),
        })
        weatherServiceMock.geocodeCity.mockResolvedValue({ latitude: -31.42, longitude: -64.18, name: 'Córdoba' })
        weatherServiceMock.fetchHistoricalWeather.mockRejectedValue(new Error('Weather API responded with status 500'))

        await expect(reportProcessor({ data: { reportId: 'report-1' } })).rejects.toThrow(
            'Weather API responded with status 500'
        )

        expect(reportServiceMock.saveErrorMessageService).toHaveBeenCalledWith(
            'report-1',
            'Weather API responded with status 500'
        )
    })
})