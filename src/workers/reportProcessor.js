import { UnrecoverableError } from 'bullmq'
import { geocodeCity, fetchHistoricalWeather } from '../services/weatherService.js'
import { generateCsv } from '../services/csvService.js'
import { getReportById, markProcessing, markFailed, markCompleted, saveErrorMessage } from '../services/reportService.js'

export default async function reportProcessor(job) {
    const { reportId } = job.data
    const report = await getReportById(reportId)

    if (!report) {
        throw new UnrecoverableError(`Report ${reportId} not found`)
    }

    await markProcessing(reportId)

    const location = await geocodeCity(report.city)

    if (!location) {
        const message = `City "${report.city}" could not be resolved`
        await markFailed(reportId, message)
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
        await markCompleted(reportId, filePath)

    } catch (error) {
        await saveErrorMessage(reportId, error.message)
        throw error
    }
}