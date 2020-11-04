import express, { Response, Request } from 'express'
import 'dotenv/config'
import connectDB from './config/db'

const app = express()
connectDB()

app.use(express.json({}))

app.get('/', (req: Request, res: Response) => {
  res.send('API running')
})

// Define routes
app.use('/api/users', require('./routes/users'))
app.use('/api/rooms', require('./routes/rooms'))

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
})
