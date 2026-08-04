import { createReportService } from '../services/reportService.js'

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