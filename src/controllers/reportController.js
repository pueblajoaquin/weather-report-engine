import fs, { fsyncSync } from 'node:fs'
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
        return res.status(500).json({ error: 'Interval server error' })
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

export async function downloadReportService(req, res) {
    const { id } = req.params

    try {
        const report = await getReportByIdService(id)

        if (!report) {
            return res.status(404).json({ error: 'Report not found' })
        }

        if (report.status !== 'completed') {
            return res.status(409).json({ error: 'Report is not ready for download' })
        }

        if (!report.filePath || !fs.exists(report.filePath)) {
            return res.status(404).json({ error: 'Report file not found on server' })
        }
    } catch (error) {

    }
}