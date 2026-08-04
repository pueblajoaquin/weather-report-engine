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
        data: { status: 'completed', filePath }
    })
    return report
}

export async function saveErrorMessageService(reportId, errorMessage) {
    return await prisma.report.update({
        where: { id: reportId },
        data: { errorMessage },
    })
}

export async function listReportsService() {
    return await prisma.report.findMany({
        orderBy: { createdAt: 'desc' }
    })
}

export async function retryReportService(reportId) {
    const report = await prisma.report.findUnique({
        where: { id: reportId }
    })

    if (!report) {
        return null
    }

    if (report.status !== 'failed') {
        throw new Error('ONLY_FALIDED_ERROR_CAN_BE_RETRIED')
    }

    const updated = await prisma.report.update({
        where: { id: reportId },
        data: { status: 'pending', errorMessage: null }
    })

    await reportQueue.add('generate-report', { reportId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } })

    return updated
}