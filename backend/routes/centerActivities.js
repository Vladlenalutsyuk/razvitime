const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/', async (req, res) => {
  const userId = Number(req.query.userId)

  if (!userId) {
    return res.status(400).json({ error: 'Не передан userId' })
  }

  try {
    const [centerRows] = await db.query(
      `SELECT id
       FROM centers
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    )

    if (!centerRows.length) {
      return res.status(404).json({ error: 'Центр не найден' })
    }

    const centerId = centerRows[0].id

    const [rows] = await db.query(
      `SELECT
         id,
         center_id,
         title,
         category,
         age_min,
         age_max,
         short_description,
         description,
         price,
         payment_type,
         capacity,
         is_active,
         created_at
       FROM activities
       WHERE center_id = ?
       ORDER BY created_at DESC`,
      [centerId]
    )

    res.json(rows)
  } catch (error) {
    console.error('center activities get error', error)
    res.status(500).json({ error: 'Ошибка загрузки кружков центра' })
  }
})

router.post('/', async (req, res) => {
  const {
    userId,
    title,
    category,
    age_min,
    age_max,
    short_description,
    description,
    price,
    payment_type,
    capacity,
    sessions,
  } = req.body

  if (!userId || !title || !category || age_min == null || age_max == null) {
    return res.status(400).json({ error: 'Не хватает обязательных полей кружка' })
  }

  try {
    const [centerRows] = await db.query(
      `SELECT id
       FROM centers
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    )

    if (!centerRows.length) {
      return res.status(404).json({ error: 'Центр не найден' })
    }

    const centerId = centerRows[0].id

    const [result] = await db.query(
      `INSERT INTO activities
       (center_id, title, category, age_min, age_max, short_description, description, price, payment_type, capacity, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        centerId,
        title,
        category,
        age_min,
        age_max,
        short_description || null,
        description || null,
        price || 0,
        payment_type || 'monthly',
        capacity || null,
      ]
    )

    const activityId = result.insertId

    if (Array.isArray(sessions) && sessions.length > 0) {
      for (const session of sessions) {
        await db.query(
          `INSERT INTO activity_sessions (activity_id, weekday, start_time, end_time)
           VALUES (?, ?, ?, ?)`,
          [
            activityId,
            session.weekday,
            session.start_time,
            session.end_time,
          ]
        )
      }
    }

    const [rows] = await db.query(
      `SELECT
         id,
         center_id,
         title,
         category,
         age_min,
         age_max,
         short_description,
         description,
         price,
         payment_type,
         capacity,
         is_active
       FROM activities
       WHERE id = ?`,
      [activityId]
    )

    res.status(201).json(rows[0])
  } catch (error) {
    console.error('center activities create error', error)
    res.status(500).json({ error: 'Ошибка создания кружка' })
  }
})

router.put('/:id', async (req, res) => {
  const activityId = Number(req.params.id)
  const {
    title,
    category,
    age_min,
    age_max,
    short_description,
    description,
    price,
    payment_type,
    capacity,
    is_active,
    sessions,
  } = req.body

  if (!activityId) {
    return res.status(400).json({ error: 'Некорректный id кружка' })
  }

  try {
    await db.query(
      `UPDATE activities
       SET
         title = ?,
         category = ?,
         age_min = ?,
         age_max = ?,
         short_description = ?,
         description = ?,
         price = ?,
         payment_type = ?,
         capacity = ?,
         is_active = ?
       WHERE id = ?`,
      [
        title,
        category,
        age_min,
        age_max,
        short_description || null,
        description || null,
        price || 0,
        payment_type || 'monthly',
        capacity || null,
        is_active ? 1 : 0,
        activityId,
      ]
    )

    if (Array.isArray(sessions)) {
      await db.query(
        `DELETE FROM activity_sessions
         WHERE activity_id = ?`,
        [activityId]
      )

      for (const session of sessions) {
        await db.query(
          `INSERT INTO activity_sessions (activity_id, weekday, start_time, end_time)
           VALUES (?, ?, ?, ?)`,
          [
            activityId,
            session.weekday,
            session.start_time,
            session.end_time,
          ]
        )
      }
    }

    const [rows] = await db.query(
      `SELECT
         id,
         center_id,
         title,
         category,
         age_min,
         age_max,
         short_description,
         description,
         price,
         payment_type,
         capacity,
         is_active
       FROM activities
       WHERE id = ?`,
      [activityId]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Кружок не найден' })
    }

    res.json(rows[0])
  } catch (error) {
    console.error('center activities update error', error)
    res.status(500).json({ error: 'Ошибка обновления кружка' })
  }
})

router.delete('/:id', async (req, res) => {
  const activityId = Number(req.params.id)

  if (!activityId) {
    return res.status(400).json({ error: 'Некорректный id кружка' })
  }

  try {
    await db.query(
      `DELETE FROM activities
       WHERE id = ?`,
      [activityId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('center activities delete error', error)
    res.status(500).json({ error: 'Ошибка удаления кружка' })
  }
})

module.exports = router