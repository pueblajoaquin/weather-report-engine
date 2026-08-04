import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const REPORTS_DIR = path.resolve('reports')

export async function generateCsv(reportId, weatherData) {
    const { time, temperature_2m_max, temperature_2m_min, precipitation_sum } = weatherData.daily

    const header = 'date,temp_max,temp_min,precipitation_sum\n'
    const rows = time
        .map((date, i) =>
            `${date},${temperature_2m_max[i]},${temperature_2m_min[i]},${precipitation_sum[i]}`
        )
        .join('\n')

    await mkdir(REPORTS_DIR, { recursive: true })

    const filePath = path.join(REPORTS_DIR, `${reportId}.csv`)
    await writeFile(filePath, header + rows)

    return filePath
}