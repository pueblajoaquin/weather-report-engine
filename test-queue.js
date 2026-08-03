import 'dotenv/config'
import reportQueue from './src/queues/reportQueue.js'

const job = await reportQueue.add('test-job', { message: 'hello from BullMQ' })
console.log('Job agregado con id:', job.id)
process.exit(0)