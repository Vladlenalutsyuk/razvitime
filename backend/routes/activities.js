const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/', async (req, res) => {
  const { city, age, category, search } = req.query

  try {
    let sql = `
      SELECT
        a.id,
        a.title,
        a.category,
        a.age_min,
        a.age_max,
        a.short_description,
        a.description,
        a.price,
        a.payment_type,
        c.id AS center_id,
        c.name AS center_name,
        c.city,
        c.address
      FROM activities a
      JOIN centers c ON c.id = a.center_id
      WHERE a.is_active = 1
        AND c.is_active = 1
    `

    const params = []

    if (city) {
      sql += ` AND c.city LIKE ?`
      params.push(`%${city}%`)
    }

    if (age) {
      sql += ` AND a.age_min <= ? AND a.age_max >= ?`
      params.push(Number(age), Number(age))
    }

    if (category) {
      sql += ` AND a.category = ?`
      params.push(category)
    }

    if (search) {
      sql += ` AND (
        a.title LIKE ?
        OR a.short_description LIKE ?
        OR c.name LIKE ?
        OR c.address LIKE ?
      )`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }

    sql += ` ORDER BY a.created_at DESC`

    const [rows] = await db.query(sql, params)
    res.json(rows)
  } catch (error) {
    console.error('activities get error', error)
    res.status(500).json({ error: 'Ошибка загрузки кружков' })
  }
})

router.get('/:id', async (req, res) => {
  const activityId = Number(req.params.id)

  if (!activityId) {
    return res.status(400).json({ error: 'Некорректный id кружка' })
  }

  try {
    const [rows] = await db.query(
      `SELECT
         a.id,
         a.title,
         a.category,
         a.age_min,
         a.age_max,
         a.short_description,
         a.description,
         a.price,
         a.payment_type,
         a.capacity,
         c.id AS center_id,
         c.name AS center_name,
         c.city,
         c.address,
         c.phone,
         c.email,
         c.website,
         c.logo_url
       FROM activities a
       JOIN centers c ON c.id = a.center_id
       WHERE a.id = ?
       LIMIT 1`,
      [activityId]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Кружок не найден' })
    }

    const [sessions] = await db.query(
      `SELECT id, activity_id, weekday, start_time, end_time
       FROM activity_sessions
       WHERE activity_id = ?
       ORDER BY weekday, start_time`,
      [activityId]
    )

    res.json({
      ...rows[0],
      sessions,
    })
  } catch (error) {
    console.error('activity detail error', error)
    res.status(500).json({ error: 'Ошибка загрузки кружка' })
  }
})

module.exports = router