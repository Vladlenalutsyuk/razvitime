//D:\Data USER\Desktop\razvitime\backend\routes\auth.js
const express = require('express')
const router = express.Router()
const db = require('../db')

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Укажите email, пароль и роль' })
  }

  try {
    const [rows] = await db.query(
      `SELECT id, email, phone, password_hash, role, status
       FROM users
       WHERE email = ? AND role = ?
       LIMIT 1`,
      [email, role]
    )

    if (!rows.length) {
      return res.status(401).json({ error: 'Неверные данные для входа' })
    }

    const user = rows[0]

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Аккаунт не активен' })
    }

    // Пока без bcrypt, как и договорились
    if (user.password_hash !== password) {
      return res.status(401).json({ error: 'Неверные данные для входа' })
    }

    let profile = null

    if (user.role === 'parent') {
      const [profileRows] = await db.query(
        `SELECT id, full_name, city, telegram, whatsapp, email, avatar_url
         FROM parent_profiles
         WHERE user_id = ?
         LIMIT 1`,
        [user.id]
      )

      profile = profileRows[0] || null
    }

    if (user.role === 'center_admin') {
      const [centerRows] = await db.query(
        `SELECT id, name, city, logo_url
         FROM centers
         WHERE user_id = ?
         LIMIT 1`,
        [user.id]
      )

      profile = centerRows[0] || null
    }

    await db.query(
      `UPDATE users
       SET last_login_at = NOW()
       WHERE id = ?`,
      [user.id]
    )

    res.json({
      token: `demo-${user.role}-${user.id}`,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        name:
          profile?.full_name ||
          profile?.name ||
          'Пользователь',
        profile,
      },
    })
  } catch (error) {
    console.error('auth login error', error)
    res.status(500).json({ error: 'Ошибка авторизации' })
  }
})

module.exports = router