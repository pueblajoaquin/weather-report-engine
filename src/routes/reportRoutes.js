import { Router } from 'express'
import { createReportController } from '../controllers/reportController.js'

const router = Router()

router.post('/reports', createReportController)

export default router