import prisma from '../prisma.js'
import reportQueue from '../queues/reportQueue.js'

export async function createReportService({ city, startDate, endDate }) {
    const report = await prisma.report.create({
        data: {
            city,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: 'pending',
        },
    })

    await reportQueue.add('generate-report', { reportId: report.id })

    return report
}