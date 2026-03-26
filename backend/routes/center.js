const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/profile', async (req, res) => {
  const userId = Number(req.query.userId)

  if (!userId) {
    return res.status(400).json({ error: 'Не передан userId' })
  }

  try {
    const [rows] = await db.query(
      `SELECT
         id,
         user_id,
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
         photo_url,
         is_active,
         moderation_status
       FROM centers
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Центр не найден' })
    }

    res.json(rows[0])
  } catch (error) {
    console.error('center profile get error', error)
    res.status(500).json({ error: 'Ошибка загрузки профиля центра' })
  }
})

router.put('/profile', async (req, res) => {
  const {
    userId,
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
    photo_url,
  } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'Не передан userId' })
  }

  try {
    await db.query(
      `UPDATE centers
       SET
         name = ?,
         short_description = ?,
         full_description = ?,
         city = ?,
         address = ?,
         landmark = ?,
         phone = ?,
         email = ?,
         website = ?,
         telegram = ?,
         whatsapp = ?,
         vk = ?,
         logo_url = ?,
         photo_url = ?
       WHERE user_id = ?`,
      [
        name,
        short_description || null,
        full_description || null,
        city,
        address,
        landmark || null,
        phone || null,
        email || null,
        website || null,
        telegram || null,
        whatsapp || null,
        vk || null,
        logo_url || null,
        photo_url || null,
        userId,
      ]
    )

    const [rows] = await db.query(
      `SELECT
         id,
         user_id,
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
         photo_url,
         is_active,
         moderation_status
       FROM centers
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Центр не найден после обновления' })
    }

    res.json(rows[0])
  } catch (error) {
    console.error('center profile update error', error)
    res.status(500).json({ error: 'Ошибка сохранения профиля центра' })
  }
})

router.get('/dashboard', async (req, res) => {
  const userId = Number(req.query.userId)

  if (!userId) {
    return res.status(400).json({ error: 'Не передан userId' })
  }

  try {
    const [centerRows] = await db.query(
      `SELECT id, name
       FROM centers
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    )

    if (!centerRows.length) {
      return res.status(404).json({ error: 'Центр не найден' })
    }

    const center = centerRows[0]

    const [activitiesCountRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM activities
       WHERE center_id = ?`,
      [center.id]
    )

    const [enrollmentsCountRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM enrollments e
       JOIN activities a ON a.id = e.activity_id
       WHERE a.center_id = ?`,
      [center.id]
    )

    const [subscriptionRows] = await db.query(
      `SELECT
         cs.status,
         cs.start_date,
         cs.end_date,
         s.name AS subscription_name,
         s.price
       FROM center_subscriptions cs
       JOIN subscriptions s ON s.id = cs.subscription_id
       WHERE cs.center_id = ?
       ORDER BY cs.id DESC
       LIMIT 1`,
      [center.id]
    )

    res.json({
      center: {
        id: center.id,
        name: center.name,
      },
      stats: {
        activitiesCount: activitiesCountRows[0].total,
        enrollmentsCount: enrollmentsCountRows[0].total,
      },
      subscription: subscriptionRows[0] || null,
    })
  } catch (error) {
    console.error('center dashboard error', error)
    res.status(500).json({ error: 'Ошибка загрузки дашборда центра' })
  }
})

module.exports = router