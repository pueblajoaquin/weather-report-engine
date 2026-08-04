import { UnrecoverableError } from 'bullmq'
import { geocodeCity, fetchHistoricalWeather } from '../services/weatherService.js'
import { generateCsv } from '../services/csvService.js'
import { getReportByIdService, markProcessingService, markFailedService, markCompletedService, saveErrorMessageService } from '../services/reportService.js'

export default async function reportProcessor(job) {
    const { reportId } = job.data
    const report = await getReportByIdService(reportId)

    if (!report) {
        throw new UnrecoverableError(`Report ${reportId} not found`)
    }

    await markProcessingService(reportId)

    const location = await geocodeCity(report.city)

    if (!location) {
        const message = `City "${report.city}" could not be resolved`
        await markFailedService(reportId, message)
        throw new UnrecoverableError(message)
    }

    try {
        const weatherData = await fetchHistoricalWeather({
            latitude: location.latitude,
            longitude: location.longitude,
            startDate: report.startDate.toISOString().split('T')[0],
            endDate: report.endDate.toISOString().split('T')[0]
        })

        const filePath = await generateCsv(reportId, weatherData)
        await markCompletedService(reportId, filePath)

    } catch (error) {
        await saveErrorMessageService(reportId, error.message)
        throw error
    }
}