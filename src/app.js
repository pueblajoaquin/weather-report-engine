import express from 'express'
import reportRoutes from './routes/reportRoutes.js'

const app = express()

app.use(express.json())
app.use('/', reportRoutes)

export default app 