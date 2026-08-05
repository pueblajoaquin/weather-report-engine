import { beforeEach, describe, expect, it, vi } from 'vitest'

const fsPromisesMock = vi.hoisted(() => ({
    mkdir: vi.fn(),
    writeFile: vi.fn(),
}))

vi.mock('node:fs/promises', () => fsPromisesMock)

import { generateCsv } from '../services/csvService.js'

beforeEach(() => {
    vi.clearAllMocks()
})

describe('csvService', () => {
    it('writes a csv report file and returns the path', async () => {
        fsPromisesMock.mkdir.mockResolvedValue(undefined)
        fsPromisesMock.writeFile.mockResolvedValue(undefined)

        await expect(
            generateCsv('report-1', {
                daily: {
                    time: ['2024-01-01', '2024-01-02'],
                    temperature_2m_max: [30, 31],
                    temperature_2m_min: [15, 16],
                    precipitation_sum: [0.2, 0.0],
                },
            })
        ).resolves.toMatch(/reports[\\/]report-1\.csv$/)

        expect(fsPromisesMock.mkdir).toHaveBeenCalled()
        expect(fsPromisesMock.writeFile).toHaveBeenCalledWith(
            expect.stringMatching(/report-1\.csv$/),
            'date,temp_max,temp_min,precipitation_sum\n2024-01-01,30,15,0.2\n2024-01-02,31,16,0'
        )
    })
})