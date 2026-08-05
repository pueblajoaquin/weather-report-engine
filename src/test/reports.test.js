import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

import reportServiceMock from '../__mocks__/reportService.js'

vi.mock('../services/reportService.js', () => reportServiceMock)

import app from '../app.js'

beforeEach(() => {
    vi.clearAllMocks()
})

describe('POST /reports', () => {
    it('creates a report and returns 201', async () => {
        reportServiceMock.createReportService.mockResolvedValue({
            id: 'abc-123',
            status: 'pending',
        })

        const res = await request(app)
            .post('/reports')
            .send({ city: 'Rio Cuarto', startDate: '2024-01-01', endDate: '2024-01-07' })

        expect(res.status).toBe(201)
        expect(res.body).toEqual({ id: 'abc-123', status: 'pending' })
        expect(reportServiceMock.createReportService).toHaveBeenCalledWith({
            city: 'Rio Cuarto',
            startDate: '2024-01-01',
            endDate: '2024-01-07',
        })
    })

    it('returns 400 when required fields are missing', async () => {
        const res = await request(app).post('/reports').send({ city: 'Rio Cuarto' })

        expect(res.status).toBe(400)
        expect(reportServiceMock.createReportService).not.toHaveBeenCalled()
    })
})

describe('GET /reports/:id', () => {
    it('returns 200 with report data when found', async () => {
        reportServiceMock.getReportByIdService.mockResolvedValue({
            id: 'abc-123',
            city: 'Rio Cuarto',
            status: 'completed',
        })

        const res = await request(app).get('/reports/abc-123')

        expect(res.status).toBe(200)
        expect(res.body.status).toBe('completed')
    })

    it('returns 404 when report does not exist', async () => {
        reportServiceMock.getReportByIdService.mockResolvedValue(null)

        const res = await request(app).get('/reports/does-not-exist')

        expect(res.status).toBe(404)
    })
})

describe('GET /reports/:id/download', () => {
    it('returns 409 when report is not completed', async () => {
        reportServiceMock.getReportByIdService.mockResolvedValue({ id: 'abc-123', status: 'pending' })

        const res = await request(app).get('/reports/abc-123/download')

        expect(res.status).toBe(409)
    })

    it('returns 404 when report does not exist', async () => {
        reportServiceMock.getReportByIdService.mockResolvedValue(null)

        const res = await request(app).get('/reports/abc-123/download')

        expect(res.status).toBe(404)
    })
})

describe('GET /reports', () => {
    it('returns 200 with a list of reports', async () => {
        reportServiceMock.listReportsService.mockResolvedValue([
            { id: '1', status: 'completed' },
            { id: '2', status: 'pending' },
        ])

        const res = await request(app).get('/reports')

        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(2)
    })
})

describe('POST /reports/:id/retry', () => {
    it('returns 202 when retrying a failed report', async () => {
        reportServiceMock.retryReportService.mockResolvedValue({ id: 'abc-123', status: 'pending' })

        const res = await request(app).post('/reports/abc-123/retry')

        expect(res.status).toBe(202)
        expect(res.body.status).toBe('pending')
    })

    it('returns 409 when report is not failed', async () => {
        reportServiceMock.retryReportService.mockRejectedValue(
            new Error('Only failed reports can be retried (current status: completed)')
        )

        const res = await request(app).post('/reports/abc-123/retry')

        expect(res.status).toBe(409)
    })

    it('returns 404 when report does not exist', async () => {
        reportServiceMock.retryReportService.mockResolvedValue(null)

        const res = await request(app).post('/reports/abc-123/retry')

        expect(res.status).toBe(404)
    })
})