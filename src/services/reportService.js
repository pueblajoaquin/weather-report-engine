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

export async function getReportByIdService(reportId) {
    const report = await prisma.report.findUnique({
        where: {
            id: reportId
        }
    })
    return report
}

export async function markProcessingService(reportId) {
    return await prisma.report.update({
        where: { id: reportId },
        data: { status: 'processing' },
    })
}

export async function markFailedService(reportId, errorMessage) {
    const report = await prisma.report.update({
        where: { id: reportId },
        data: { status: 'failed', errorMessage }
    })
    return report
}

export async function markCompletedService(reportId, filePath) {
    const report = await prisma.report.update({
        where: { id: reportId },
        data: { status: 'failed', filePath }
    })
    return report
}

export async function saveErrorMessageService(reportId, errorMessage) {
    return await prisma.report.update({
        where: { id: reportId },
        data: { errorMessage },
    })
}