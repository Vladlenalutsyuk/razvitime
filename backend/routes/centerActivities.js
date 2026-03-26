const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'Не передан userId' })
    }

    const [centers] = await db.query(
      'SELECT id FROM centers WHERE user_id = ? LIMIT 1',
      [userId]
    )

    if (centers.length === 0) {
      return res.status(404).json({ error: 'Центр не найден' })
    }

    const centerId = centers[0].id

    const [activities] = await db.query(
      `
      SELECT
        a.id,
        a.center_id,
        a.title,
        a.category,
        a.age_min,
        a.age_max,
        a.short_description,
        a.description,
        a.price,
        a.payment_type,
        a.capacity,
        a.is_active
      FROM activities a
      WHERE a.center_id = ?
      ORDER BY a.id DESC
      `,
      [centerId]
    )

    const activityIds = activities.map((item) => item.id)

    let sessions = []

    if (activityIds.length > 0) {
      const [sessionRows] = await db.query(
        `
        SELECT
          id,
          activity_id,
          weekday,
          start_time,
          end_time
        FROM activity_sessions
        WHERE activity_id IN (?)
        ORDER BY weekday, start_time
        `,
        [activityIds]
      )

      sessions = sessionRows
    }

    const activitiesWithSessions = activities.map((activity) => ({
      ...activity,
      sessions: sessions.filter(
        (session) => session.activity_id === activity.id
      ),
    }))

    res.json(activitiesWithSessions)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Ошибка загрузки кружков центра' })
  }
})

router.post('/', async (req, res) => {
  const connection = await db.getConnection()

  try {
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
      return res.status(400).json({ error: 'Не заполнены обязательные поля' })
    }

    const [centers] = await connection.query(
      'SELECT id FROM centers WHERE user_id = ? LIMIT 1',
      [userId]
    )

    if (centers.length === 0) {
      return res.status(404).json({ error: 'Центр не найден' })
    }

    const centerId = centers[0].id

    await connection.beginTransaction()

    const [result] = await connection.query(
      `
      INSERT INTO activities (
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
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `,
      [
        centerId,
        title,
        category,
        age_min,
        age_max,
        short_description || null,
        description || null,
        price ?? 0,
        payment_type || 'monthly',
        capacity ?? null,
      ]
    )

    const activityId = result.insertId

    if (Array.isArray(sessions) && sessions.length > 0) {
      const validSessions = sessions.filter(
        (item) =>
          item &&
          Number(item.weekday) >= 1 &&
          Number(item.weekday) <= 7 &&
          item.start_time &&
          item.end_time
      )

      for (const session of validSessions) {
        await connection.query(
          `
          INSERT INTO activity_sessions (
            activity_id,
            weekday,
            start_time,
            end_time
          )
          VALUES (?, ?, ?, ?)
          `,
          [
            activityId,
            Number(session.weekday),
            session.start_time,
            session.end_time,
          ]
        )
      }
    }

    await connection.commit()

    const [activities] = await connection.query(
      `
      SELECT
        a.id,
        a.center_id,
        a.title,
        a.category,
        a.age_min,
        a.age_max,
        a.short_description,
        a.description,
        a.price,
        a.payment_type,
        a.capacity,
        a.is_active
      FROM activities a
      WHERE a.id = ?
      LIMIT 1
      `,
      [activityId]
    )

    const [sessionRows] = await connection.query(
      `
      SELECT
        id,
        activity_id,
        weekday,
        start_time,
        end_time
      FROM activity_sessions
      WHERE activity_id = ?
      ORDER BY weekday, start_time
      `,
      [activityId]
    )

    res.status(201).json({
      ...activities[0],
      sessions: sessionRows,
    })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res.status(500).json({ error: 'Не удалось создать кружок' })
  } finally {
    connection.release()
  }
})

router.put('/:id', async (req, res) => {
  const connection = await db.getConnection()

  try {
    const { id } = req.params
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

    if (!title || !category || age_min == null || age_max == null) {
      return res.status(400).json({ error: 'Не заполнены обязательные поля' })
    }

    await connection.beginTransaction()

    await connection.query(
      `
      UPDATE activities
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
      WHERE id = ?
      `,
      [
        title,
        category,
        age_min,
        age_max,
        short_description || null,
        description || null,
        price ?? 0,
        payment_type || 'monthly',
        capacity ?? null,
        is_active ? 1 : 0,
        id,
      ]
    )

    await connection.query(
      'DELETE FROM activity_sessions WHERE activity_id = ?',
      [id]
    )

    if (Array.isArray(sessions) && sessions.length > 0) {
      const validSessions = sessions.filter(
        (item) =>
          item &&
          Number(item.weekday) >= 1 &&
          Number(item.weekday) <= 7 &&
          item.start_time &&
          item.end_time
      )

      for (const session of validSessions) {
        await connection.query(
          `
          INSERT INTO activity_sessions (
            activity_id,
            weekday,
            start_time,
            end_time
          )
          VALUES (?, ?, ?, ?)
          `,
          [
            id,
            Number(session.weekday),
            session.start_time,
            session.end_time,
          ]
        )
      }
    }

    await connection.commit()

    const [activities] = await connection.query(
      `
      SELECT
        a.id,
        a.center_id,
        a.title,
        a.category,
        a.age_min,
        a.age_max,
        a.short_description,
        a.description,
        a.price,
        a.payment_type,
        a.capacity,
        a.is_active
      FROM activities a
      WHERE a.id = ?
      LIMIT 1
      `,
      [id]
    )

    if (activities.length === 0) {
      return res.status(404).json({ error: 'Кружок не найден' })
    }

    const [sessionRows] = await connection.query(
      `
      SELECT
        id,
        activity_id,
        weekday,
        start_time,
        end_time
      FROM activity_sessions
      WHERE activity_id = ?
      ORDER BY weekday, start_time
      `,
      [id]
    )

    res.json({
      ...activities[0],
      sessions: sessionRows,
    })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res.status(500).json({ error: 'Не удалось обновить кружок' })
  } finally {
    connection.release()
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    await db.query('DELETE FROM activity_sessions WHERE activity_id = ?', [id])
    await db.query('DELETE FROM activities WHERE id = ?', [id])

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Не удалось удалить кружок' })
  }
})

module.exports = router