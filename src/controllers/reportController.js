import fs from 'node:fs'
import { createReportService, getReportByIdService, listReportsService, retryReportService } from '../services/reportService.js'

export async function createReportController(req, res) {
    const { city, startDate, endDate } = req.body

    if (!city || !startDate || !endDate) {
        return res.status(400).json({ error: 'city, startDate and endDate are required' })
    }

    try {
        const report = await createReportService({ city, startDate, endDate })
        return res.status(201).json({ id: report.id, status: report.status })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

export async function getReportStatusController(req, res) {
    const { id } = req.params

    try {
        const report = await getReportByIdService(id)

        if (!report) {
            return res.status(404).json({ error: 'Report not found' })
        }

        return res.status(200).json(report)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

export async function downloadReportController(req, res) {
    const { id } = req.params

    try {
        const report = await getReportByIdService(id)

        if (!report) {
            return res.status(404).json({ error: 'Report not found' })
        }

        if (report.status !== 'completed') {
            return res.status(409).json({ error: 'Report is not ready for download' })
        }

        if (!report.filePath || !fs.existsSync(report.filePath)) {
            return res.status(404).json({ error: 'Report file not found on server' })
        }

        return res.status(200).download(report.filePath, `weather-report-${id}.csv`)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

export async function getAllReportsController(req, res) {
    try {
        const reports = await listReportsService()
        return res.status(200).json(reports)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

export async function retryReportController(req, res) {
    const { id } = req.params

    try {
        const result = await retryReportService(id)

        if (!result) {
            return res.status(404).json({ error: 'Report not found' })
        }

        return res.status(202).json(result)
    } catch (error) {
        if (error.message.startsWith('Only failed reports can be retried')) {
            return res.status(409).json({ error: error.message })
        }
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}