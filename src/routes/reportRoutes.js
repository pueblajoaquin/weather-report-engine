import { Router } from 'express'
import { createReportController, getAllReportsController, downloadReportController, getReportStatusController, retryReportController } from '../controllers/reportController.js'

const router = Router()

router.post('/reports', createReportController)

router.get('/reports', getAllReportsController)

router.get('/reports/:id', getReportStatusController)

router.post('/reports/:id/retry', retryReportController)

router.get('/reports/:id/download', downloadReportController)

export default router