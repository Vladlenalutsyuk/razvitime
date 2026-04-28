//D:\Data USER\Desktop\razvitime\backend\auth.js
const express = require('express')
const router = express.Router()
const db = require('../db')

const DEMO_PASSWORDS = {
  parent: 'parent123',
  center_admin: 'center123',
  admin: 'admin123',
}

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Укажите e-mail и пароль' })
  }

  try {
    const [rows] = await db.query(
      `SELECT 
          u.id,
          u.role,
          pp.full_name AS parent_name,
          c.name AS center_name
       FROM users u
       LEFT JOIN parent_profiles pp ON pp.user_id = u.id
       LEFT JOIN centers c ON c.user_id = u.id
       WHERE u.email = ?`,
      [email]
    )

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Неверный логин или пароль' })
    }

    const user = rows[0]

    if (role && user.role !== role) {
      return res.status(401).json({ error: 'Роль пользователя не совпадает' })
    }

    const expectedPassword = DEMO_PASSWORDS[user.role]

    if (!expectedPassword || password !== expectedPassword) {
      return res.status(401).json({ error: 'Неверный логин или пароль' })
    }

    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [
      user.id,
    ])

    const demoToken = `demo-${user.role}-${user.id}`

    res.json({
      token: demoToken,
      user: {
        id: user.id,
        role: user.role,
        name:
          user.parent_name ||
          user.center_name ||
          (user.role === 'admin' ? 'Администратор' : 'Пользователь'),
      },
    })
  } catch (error) {
    console.error('auth error', error)
    res.status(500).json({ error: 'Ошибка сервера при входе' })
  }
})

module.exports = router