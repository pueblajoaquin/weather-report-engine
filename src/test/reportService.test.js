import { beforeEach, describe, expect, it, vi } from 'vitest'

import prismaMock from '../__mocks__/prisma.js'
import reportQueueMock from '../__mocks__/reportQueue.js'

vi.mock('../prisma.js', () => ({ default: prismaMock }))

vi.mock('../queues/reportQueue.js', () => ({ default: reportQueueMock }))

import {
    createReportService,
    getReportByIdService,
    listReportsService,
    markCompletedService,
    markFailedService,
    markProcessingService,
    retryReportService,
    saveErrorMessageService,
} from '../services/reportService.js'

beforeEach(() => {
    vi.clearAllMocks()
})

describe('reportService', () => {
    it('creates a pending report and queues generation', async () => {
        prismaMock.report.create.mockResolvedValue({ id: 'report-1', status: 'pending' })
        reportQueueMock.add.mockResolvedValue({})

        const result = await createReportService({
            city: 'Córdoba',
            startDate: '2024-01-01',
            endDate: '2024-01-07',
        })

        expect(result.id).toBe('report-1')
        expect(prismaMock.report.create).toHaveBeenCalledWith({
            data: {
                city: 'Córdoba',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-07'),
                status: 'pending',
            },
        })
        expect(reportQueueMock.add).toHaveBeenCalledWith(
            'generate-report',
            { reportId: 'report-1' },
            expect.objectContaining({ attempts: 3, backoff: { type: 'exponential', delay: 5000 } })
        )
    })

    it('returns a report by id', async () => {
        prismaMock.report.findUnique.mockResolvedValue({ id: 'report-1' })

        await expect(getReportByIdService('report-1')).resolves.toEqual({ id: 'report-1' })
    })

    it('lists reports ordered by createdAt desc', async () => {
        prismaMock.report.findMany.mockResolvedValue([])

        await listReportsService()

        expect(prismaMock.report.findMany).toHaveBeenCalledWith({
            orderBy: { createdAt: 'desc' },
        })
    })

    it('marks a report as processing', async () => {
        prismaMock.report.update.mockResolvedValue({ id: 'report-1', status: 'processing' })

        await markProcessingService('report-1')

        expect(prismaMock.report.update).toHaveBeenCalledWith({
            where: { id: 'report-1' },
            data: { status: 'processing' },
        })
    })

    it('marks a report as failed', async () => {
        prismaMock.report.update.mockResolvedValue({ id: 'report-1', status: 'failed' })

        await markFailedService('report-1', 'boom')

        expect(prismaMock.report.update).toHaveBeenCalledWith({
            where: { id: 'report-1' },
            data: { status: 'failed', errorMessage: 'boom' },
        })
    })

    it('marks a report as completed', async () => {
        prismaMock.report.update.mockResolvedValue({ id: 'report-1', status: 'completed' })

        await markCompletedService('report-1', 'reports/report-1.csv')

        expect(prismaMock.report.update).toHaveBeenCalledWith({
            where: { id: 'report-1' },
            data: { status: 'completed', filePath: 'reports/report-1.csv' },
        })
    })

    it('saves an error message', async () => {
        prismaMock.report.update.mockResolvedValue({ id: 'report-1' })

        await saveErrorMessageService('report-1', 'weather api failed')

        expect(prismaMock.report.update).toHaveBeenCalledWith({
            where: { id: 'report-1' },
            data: { errorMessage: 'weather api failed' },
        })
    })

    it('retries failed reports and requeues the job', async () => {
        prismaMock.report.findUnique.mockResolvedValue({ id: 'report-1', status: 'failed' })
        prismaMock.report.update.mockResolvedValue({ id: 'report-1', status: 'pending' })
        reportQueueMock.add.mockResolvedValue({})

        const result = await retryReportService('report-1')

        expect(result.status).toBe('pending')
        expect(reportQueueMock.add).toHaveBeenCalledWith(
            'generate-report',
            { reportId: 'report-1' },
            expect.objectContaining({ attempts: 3 })
        )
    })

    it('returns null when retrying a missing report', async () => {
        prismaMock.report.findUnique.mockResolvedValue(null)

        await expect(retryReportService('missing')).resolves.toBeNull()
    })

    it('rejects retrying non-failed reports', async () => {
        prismaMock.report.findUnique.mockResolvedValue({ id: 'report-1', status: 'completed' })

        await expect(retryReportService('report-1')).rejects.toThrow(
            'Only failed reports can be retried (current status: completed)'
        )
    })
})