import { vi } from 'vitest'

const reportServiceMock = {
    createReportService: vi.fn(),
    getReportByIdService: vi.fn(),
    listReportsService: vi.fn(),
    retryReportService: vi.fn(),
    markProcessingService: vi.fn(),
    markFailedService: vi.fn(),
    markCompletedService: vi.fn(),
    saveErrorMessageService: vi.fn(),
}

export default reportServiceMock