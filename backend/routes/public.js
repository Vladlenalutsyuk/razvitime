const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/reviews', async (req, res) => {
  try {
    const { type } = req.query

    const params = []
    let whereSql = 'WHERE r.is_published = 1'

    if (type === 'parent' || type === 'center') {
      whereSql += ' AND r.type = ?'
      params.push(type)
    }

    const [rows] = await db.query(
      `
      SELECT
        r.id,
        r.type,
        r.author_name,
        r.role,
        r.text,
        r.center_id,
        c.name AS center_name
      FROM reviews r
      LEFT JOIN centers c ON c.id = r.center_id
      ${whereSql}
      ORDER BY r.created_at DESC, r.id DESC
      `,
      params
    )

    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Не удалось загрузить отзывы',
    })
  }
})

router.get('/partners', async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        id,
        name,
        city,
        short_description,
        logo_url
      FROM centers
      WHERE is_active = 1
        AND moderation_status = 'approved'
      ORDER BY id DESC
      LIMIT 12
      `
    )

    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Не удалось загрузить центры',
    })
  }
})

router.get('/centers/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [centers] = await db.query(
      `
      SELECT
        id,
        name,
        short_description,
        full_description,
        city,
        address,
        landmark,
        phone,
        email,
        website,
        telegram,
        whatsapp,
        vk,
        logo_url,
        photo_url
      FROM centers
      WHERE id = ?
        AND is_active = 1
        AND moderation_status = 'approved'
      LIMIT 1
      `,
      [id]
    )

    if (centers.length === 0) {
      return res.status(404).json({
        error: 'Центр не найден',
      })
    }

    const center = centers[0]

    const [activities] = await db.query(
      `
      SELECT
        id,
        title,
        category,
        age_min,
        age_max,
        short_description,
        description,
        price,
        payment_type,
        is_active
      FROM activities
      WHERE center_id = ?
        AND is_active = 1
      ORDER BY id DESC
      `,
      [id]
    )

    const activityIds = activities.map((activity) => activity.id)

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

    res.json({
      ...center,
      activities: activitiesWithSessions,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Не удалось загрузить страницу центра',
    })
  }
})

module.exports = router