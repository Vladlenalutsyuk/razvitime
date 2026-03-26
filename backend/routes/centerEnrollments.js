const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/', async (req, res) => {
  const userId = Number(req.query.userId)
  const { status, activityId } = req.query

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

    let sql = `
      SELECT
        e.id,
        e.status,
        e.parent_comment,
        e.center_comment,
        e.created_at,
        e.updated_at,

        c.id AS child_id,
        c.name AS child_name,
        c.birthdate,

        pp.id AS parent_profile_id,
        pp.full_name AS parent_name,
        pp.telegram AS parent_telegram,
        pp.whatsapp AS parent_whatsapp,
        pp.email AS parent_email,

        u.phone AS parent_phone,

        a.id AS activity_id,
        a.title AS activity_title
      FROM enrollments e
      JOIN children c ON c.id = e.child_id
      JOIN parent_profiles pp ON pp.id = c.parent_id
      JOIN users u ON u.id = pp.user_id
      JOIN activities a ON a.id = e.activity_id
      WHERE a.center_id = ?
    `

    const params = [centerId]

    if (status) {
      sql += ` AND e.status = ?`
      params.push(status)
    }

    if (activityId) {
      sql += ` AND a.id = ?`
      params.push(Number(activityId))
    }

    sql += ` ORDER BY e.created_at DESC`

    const [rows] = await db.query(sql, params)
    res.json(rows)
  } catch (error) {
    console.error('center enrollments get error', error)
    res.status(500).json({ error: 'Ошибка загрузки заявок центра' })
  }
})

router.patch('/:id', async (req, res) => {
  const enrollmentId = Number(req.params.id)
  const { status, center_comment } = req.body

  if (!enrollmentId || !status) {
    return res.status(400).json({ error: 'Не хватает данных для обновления статуса' })
  }

  if (!['pending', 'approved', 'declined', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Некорректный статус' })
  }

  try {
    await db.query(
      `UPDATE enrollments
       SET status = ?, center_comment = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, center_comment || null, enrollmentId]
    )

    const [rows] = await db.query(
      `SELECT
         e.id,
         e.status,
         e.parent_comment,
         e.center_comment,
         e.created_at,
         e.updated_at,
         c.id AS child_id,
         c.name AS child_name,
         a.id AS activity_id,
         a.title AS activity_title
       FROM enrollments e
       JOIN children c ON c.id = e.child_id
       JOIN activities a ON a.id = e.activity_id
       WHERE e.id = ?`,
      [enrollmentId]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Заявка не найдена' })
    }

    res.json(rows[0])
  } catch (error) {
    console.error('center enrollments patch error', error)
    res.status(500).json({ error: 'Ошибка обновления заявки' })
  }
})

module.exports = router