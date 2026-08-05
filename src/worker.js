import 'dotenv/config'
import { Worker } from 'bullmq'
import connection from './queues/connection.js'
import reportProcessor from './workers/reportProcessor.js'
import { markFailedService } from './services/reportService.js'

const worker = new Worker('report-generation', reportProcessor, {
    connection,
    concurrency: 5,
})

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed for report ${job.data.reportId}`)
})

worker.on('failed', async (job, error) => {
    if (!job) {
        console.error('A job failed without context:', error.message)
        return
    }

    console.error(`Job ${job.id} failed for report ${job.data.reportId}:`, error.message)

    const maxAttempts = job.opts.attempts ?? 1

    if (job.attemptsMade >= maxAttempts) {
        await markFailedService(job.data.reportId, error.message)
    }
})

console.log('Worker listening on queue "report-generation"...')