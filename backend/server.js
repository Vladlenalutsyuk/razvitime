const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoute = require('./routes/auth')
const parentRoute = require('./routes/parent')
const childrenRoute = require('./routes/children')
const activitiesRoute = require('./routes/activities')
const enrollmentsRoute = require('./routes/enrollments')

const centerRoute = require('./routes/center')
const centerActivitiesRoute = require('./routes/centerActivities')
const centerEnrollmentsRoute = require('./routes/centerEnrollments')
const statsRoute = require('./routes/stats')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRoute)
app.use('/api/parent', parentRoute)
app.use('/api/children', childrenRoute)
app.use('/api/activities', activitiesRoute)
app.use('/api/enrollments', enrollmentsRoute)

app.use('/api/center', centerRoute)
app.use('/api/center/activities', centerActivitiesRoute)
app.use('/api/center/enrollments', centerEnrollmentsRoute)

app.use('/api/stats', statsRoute)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})