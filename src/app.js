import express from 'express'
import reportRoutes from './routes/reportRoutes'

const app = express()

app.use(express.json())
app.use('/', reportRoutes)

export default app 