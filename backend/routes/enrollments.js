const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/', async (req, res) => {
  const userId = Number(req.query.userId)

  if (!userId) {
    return res.status(400).json({ error: 'Не передан userId' })
  }

  try {
    const [parentRows] = await db.query(
      `
      SELECT id
      FROM parent_profiles
      WHERE user_id = ?
      LIMIT 1
      `,
      [userId]
    )

    if (!parentRows.length) {
      return res.status(404).json({ error: 'Родитель не найден' })
    }

    const parentId = parentRows[0].id

    const [rows] = await db.query(
      `
      SELECT
        e.id,
        e.status,
        e.created_at,
        e.child_id,
        e.activity_id,
        e.activity_session_id,
        c.name AS child_name,
        a.title,
        a.category,
        a.price,
        ctr.id AS center_id,
        ctr.name AS center_name,
        ctr.city,
        ctr.address,
        s.weekday,
        s.start_time,
        s.end_time
      FROM enrollments e
      JOIN children c ON c.id = e.child_id
      JOIN activities a ON a.id = e.activity_id
      JOIN centers ctr ON ctr.id = a.center_id
      LEFT JOIN activity_sessions s ON s.id = e.activity_session_id
      WHERE c.parent_id = ?
      ORDER BY e.created_at DESC
      `,
      [parentId]
    )

    res.json(rows)
  } catch (error) {
    console.error('enrollments get error', error)
    res.status(500).json({ error: 'Ошибка загрузки записей' })
  }
})

router.post('/', async (req, res) => {
  const { child_id, activity_id, activity_session_id, parent_comment } = req.body

  if (!child_id || !activity_id) {
    return res.status(400).json({ error: 'Не хватает данных для записи' })
  }

  try {
    const [existing] = await db.query(
      `
      SELECT id
      FROM enrollments
      WHERE child_id = ?
        AND activity_id = ?
        AND status IN ('pending', 'approved')
      LIMIT 1
      `,
      [child_id, activity_id]
    )

    if (existing.length) {
      return res.status(409).json({
        error: 'Ребёнок уже записан на этот кружок',
      })
    }

    if (activity_session_id) {
      const [sessionRows] = await db.query(
        `
        SELECT id
        FROM activity_sessions
        WHERE id = ?
          AND activity_id = ?
        LIMIT 1
        `,
        [activity_session_id, activity_id]
      )

      if (!sessionRows.length) {
        return res.status(400).json({
          error: 'Выбранное время не относится к этому кружку',
        })
      }
    }

    const [result] = await db.query(
      `
      INSERT INTO enrollments
      (child_id, activity_id, activity_session_id, status, parent_comment)
      VALUES (?, ?, ?, 'pending', ?)
      `,
      [child_id, activity_id, activity_session_id || null, parent_comment || null]
    )

    const [rows] = await db.query(
      `
      SELECT
        e.id,
        e.status,
        e.created_at,
        e.child_id,
        e.activity_id,
        e.activity_session_id,
        c.name AS child_name,
        a.title,
        a.category,
        a.price,
        ctr.id AS center_id,
        ctr.name AS center_name,
        ctr.city,
        ctr.address,
        s.weekday,
        s.start_time,
        s.end_time
      FROM enrollments e
      JOIN children c ON c.id = e.child_id
      JOIN activities a ON a.id = e.activity_id
      JOIN centers ctr ON ctr.id = a.center_id
      LEFT JOIN activity_sessions s ON s.id = e.activity_session_id
      WHERE e.id = ?
      LIMIT 1
      `,
      [result.insertId]
    )

    res.status(201).json(rows[0])
  } catch (error) {
    console.error('enrollment create error', error)
    res.status(500).json({ error: 'Ошибка создания записи' })
  }
})

router.delete('/:id', async (req, res) => {
  const enrollmentId = Number(req.params.id)

  if (!enrollmentId) {
    return res.status(400).json({ error: 'Некорректный id записи' })
  }

  try {
    await db.query(
      `
      DELETE FROM enrollments
      WHERE id = ?
      `,
      [enrollmentId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('enrollment delete error', error)
    res.status(500).json({ error: 'Ошибка удаления записи' })
  }
})

module.exports = router