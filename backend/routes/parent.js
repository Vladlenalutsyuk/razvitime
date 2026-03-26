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
         pp.id,
         pp.user_id,
         pp.full_name,
         pp.city,
         pp.telegram,
         pp.whatsapp,
         pp.email,
         pp.avatar_url,
         pp.preferred_contact,
         pp.notifications_enabled
       FROM parent_profiles pp
       WHERE pp.user_id = ?
       LIMIT 1`,
      [userId]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Профиль родителя не найден' })
    }

    res.json(rows[0])
  } catch (error) {
    console.error('parent profile get error', error)
    res.status(500).json({ error: 'Ошибка загрузки профиля' })
  }
})

router.put('/profile', async (req, res) => {
  const { userId, city, telegram, whatsapp, email, avatar_url } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'Не передан userId' })
  }

  try {
    await db.query(
      `UPDATE parent_profiles
       SET city = ?, telegram = ?, whatsapp = ?, email = ?, avatar_url = ?
       WHERE user_id = ?`,
      [city || null, telegram || null, whatsapp || null, email || null, avatar_url || null, userId]
    )

    const [rows] = await db.query(
      `SELECT
         id,
         user_id,
         full_name,
         city,
         telegram,
         whatsapp,
         email,
         avatar_url,
         preferred_contact,
         notifications_enabled
       FROM parent_profiles
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    )

    res.json(rows[0])
  } catch (error) {
    console.error('parent profile update error', error)
    res.status(500).json({ error: 'Ошибка сохранения профиля' })
  }
})

module.exports = router