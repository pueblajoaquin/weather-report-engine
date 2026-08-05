import { vi } from 'vitest'

const prismaMock = {
    report: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn()
    }
}

export default prismaMock