const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/', async (req, res) => {
  try {
    const [[parentsRow]] = await db.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'parent'"
    )

    const [[kidsRow]] = await db.query(
      'SELECT COUNT(*) AS count FROM children'
    )

    const [[centersRow]] = await db.query(
      'SELECT COUNT(*) AS count FROM centers'
    )

    const [[activitiesRow]] = await db.query(
      'SELECT COUNT(*) AS count FROM activities'
    )

    res.json({
      parents: Number(parentsRow.count) || 0,
      kids: Number(kidsRow.count) || 0,
      centers: Number(centersRow.count) || 0,
      activities: Number(activitiesRow.count) || 0,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Не удалось загрузить статистику',
    })
  }
})

module.exports = router