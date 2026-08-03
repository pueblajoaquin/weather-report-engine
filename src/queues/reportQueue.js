import { Queue } from 'bullmq'
import connection from './connection.js'

const reportQueue = new Queue('report-generation', { connection })

export default reportQueue