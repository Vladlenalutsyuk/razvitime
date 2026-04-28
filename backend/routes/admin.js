const express = require('express')
const router = express.Router()
const db = require('../db')

function isAdmin(req) {
  const header = req.headers.authorization || ''
  return header.includes('demo-admin-')
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Доступ запрещён' })
  }

  next()
}

async function createLog(title, message, type = 'system') {
  try {
    const [[admin]] = await db.query(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    )

    if (!admin) return

    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read)
       VALUES (?, ?, ?, ?, 0)`,
      [admin.id, title, message, type]
    )
  } catch (error) {
    console.error('create admin log error', error)
  }
}

async function getCenterById(centerId) {
  const [rows] = await db.query(
    `SELECT
        c.id,
        c.user_id,
        c.name,
        c.city,
        c.address,
        c.phone,
        c.email,
        c.is_active,
        c.moderation_status,
        c.created_at,
        s.name AS subscription_name,
        cs.end_date AS subscription_until,
        cs.status AS subscription_status,
        COUNT(DISTINCT a.id) AS activities_count
     FROM centers c
     LEFT JOIN activities a ON a.center_id = c.id
     LEFT JOIN center_subscriptions cs 
        ON cs.center_id = c.id 
        AND cs.status = 'active'
        AND cs.end_date >= CURDATE()
     LEFT JOIN subscriptions s ON s.id = cs.subscription_id
     WHERE c.id = ?
     GROUP BY 
        c.id, c.user_id, c.name, c.city, c.address, c.phone, c.email,
        c.is_active, c.moderation_status, c.created_at,
        s.name, cs.end_date, cs.status`,
    [centerId]
  )

  return rows[0] || null
}

router.use(requireAdmin)

router.get('/dashboard', async (req, res) => {
  try {
    const [[parents]] = await db.query(
      `SELECT COUNT(*) AS total FROM users WHERE role = 'parent'`
    )

    const [[children]] = await db.query(
      `SELECT COUNT(*) AS total FROM children`
    )

    const [[centers]] = await db.query(
      `SELECT COUNT(*) AS total FROM centers`
    )

    const [[activeCenters]] = await db.query(
      `SELECT COUNT(*) AS total FROM centers WHERE is_active = 1`
    )

    const [[pendingCenters]] = await db.query(
      `SELECT COUNT(*) AS total FROM centers WHERE moderation_status = 'pending'`
    )

    const [[blockedCenters]] = await db.query(
      `SELECT COUNT(*) AS total FROM centers WHERE is_active = 0`
    )

    const [[activities]] = await db.query(
      `SELECT COUNT(*) AS total FROM activities`
    )

    const [[activeSubscriptions]] = await db.query(
      `SELECT COUNT(*) AS total 
       FROM center_subscriptions 
       WHERE status = 'active' AND end_date >= CURDATE()`
    )

    const [[revenue]] = await db.query(
      `SELECT COALESCE(SUM(s.price), 0) AS total
       FROM center_subscriptions cs
       JOIN subscriptions s ON s.id = cs.subscription_id
       WHERE cs.status = 'active' AND cs.end_date >= CURDATE()`
    )

    const [centerGrowth] = await db.query(
      `SELECT 
          DATE_FORMAT(created_at, '%m.%Y') AS month,
          COUNT(*) AS total
       FROM centers
       GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%m.%Y')
       ORDER BY MIN(created_at)
       LIMIT 6`
    )

    const [subscriptionRevenueGrowth] = await db.query(
      `SELECT 
          DATE_FORMAT(cs.created_at, '%m.%Y') AS month,
          COALESCE(SUM(s.price), 0) AS total
       FROM center_subscriptions cs
       JOIN subscriptions s ON s.id = cs.subscription_id
       GROUP BY DATE_FORMAT(cs.created_at, '%Y-%m'), DATE_FORMAT(cs.created_at, '%m.%Y')
       ORDER BY MIN(cs.created_at)
       LIMIT 6`
    )

    res.json({
      stats: {
        parentsCount: parents.total,
        childrenCount: children.total,
        centersCount: centers.total,
        activeCentersCount: activeCenters.total,
        pendingCentersCount: pendingCenters.total,
        blockedCentersCount: blockedCenters.total,
        activitiesCount: activities.total,
        activeSubscriptionsCount: activeSubscriptions.total,
        subscriptionRevenue: Number(revenue.total),
      },
      centerGrowth,
      subscriptionRevenueGrowth,
    })
  } catch (error) {
    console.error('admin dashboard error', error)
    res.status(500).json({ error: 'Ошибка загрузки дашборда' })
  }
})

router.get('/centers', async (req, res) => {
  try {
    const { search, city, status } = req.query

    const params = []
    const where = []

    if (search) {
      where.push('c.name LIKE ?')
      params.push(`%${search}%`)
    }

    if (city) {
      where.push('c.city LIKE ?')
      params.push(`%${city}%`)
    }

    if (status === 'active') {
      where.push('c.is_active = 1')
    }

    if (status === 'blocked') {
      where.push('c.is_active = 0')
    }

    if (status === 'pending') {
      where.push("c.moderation_status = 'pending'")
    }

    if (status === 'approved') {
      where.push("c.moderation_status = 'approved'")
    }

    if (status === 'rejected') {
      where.push("c.moderation_status = 'rejected'")
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const [rows] = await db.query(
      `SELECT
          c.id,
          c.user_id,
          c.name,
          c.city,
          c.address,
          c.phone,
          c.email,
          c.is_active,
          c.moderation_status,
          c.created_at,
          s.name AS subscription_name,
          cs.end_date AS subscription_until,
          cs.status AS subscription_status,
          COUNT(DISTINCT a.id) AS activities_count
       FROM centers c
       LEFT JOIN activities a ON a.center_id = c.id
       LEFT JOIN center_subscriptions cs 
          ON cs.center_id = c.id 
          AND cs.status = 'active'
          AND cs.end_date >= CURDATE()
       LEFT JOIN subscriptions s ON s.id = cs.subscription_id
       ${whereSql}
       GROUP BY 
          c.id, c.user_id, c.name, c.city, c.address, c.phone, c.email,
          c.is_active, c.moderation_status, c.created_at,
          s.name, cs.end_date, cs.status
       ORDER BY c.id DESC`,
      params
    )

    res.json(rows)
  } catch (error) {
    console.error('admin centers error', error)
    res.status(500).json({ error: 'Ошибка загрузки центров' })
  }
})

router.patch('/centers/:id/status', async (req, res) => {
  try {
    const centerId = Number(req.params.id)
    const { is_active, moderation_status } = req.body

    await db.query(
      `UPDATE centers 
       SET is_active = ?, moderation_status = COALESCE(?, moderation_status)
       WHERE id = ?`,
      [is_active ? 1 : 0, moderation_status || null, centerId]
    )

    const center = await getCenterById(centerId)

    if (!center) {
      return res.status(404).json({ error: 'Центр не найден' })
    }

    await createLog(
      'Изменён статус центра',
      `Центр "${center.name}" получил статус "${centerStatusText(
        center.moderation_status,
        center.is_active
      )}".`,
      'system'
    )

    res.json(center)
  } catch (error) {
    console.error('admin center status error', error)
    res.status(500).json({ error: 'Ошибка изменения статуса центра' })
  }
})

router.post('/centers/:id/subscription', async (req, res) => {
  try {
    const centerId = Number(req.params.id)
    const { subscription_id, period_days } = req.body

    const [[centerExists]] = await db.query(
      `SELECT id, name FROM centers WHERE id = ?`,
      [centerId]
    )

    if (!centerExists) {
      return res.status(404).json({ error: 'Центр не найден' })
    }

    const [[subscriptionExists]] = await db.query(
      `SELECT id, name FROM subscriptions WHERE id = ?`,
      [subscription_id]
    )

    if (!subscriptionExists) {
      return res.status(404).json({ error: 'Тариф не найден' })
    }

    await db.query(
      `UPDATE center_subscriptions 
       SET status = 'expired'
       WHERE center_id = ? AND status = 'active'`,
      [centerId]
    )

    await db.query(
      `INSERT INTO center_subscriptions 
        (center_id, subscription_id, start_date, end_date, status)
       VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY), 'active')`,
      [centerId, subscription_id, period_days]
    )

    const center = await getCenterById(centerId)

    await createLog(
      'Подписка обновлена',
      `Центру "${centerExists.name}" подключён тариф "${subscriptionExists.name}" на ${period_days} дней.`,
      'subscription'
    )

    res.json(center)
  } catch (error) {
    console.error('admin subscription error', error)
    res.status(500).json({ error: 'Ошибка обновления подписки' })
  }
})

router.post('/centers/:id/reset-password', async (req, res) => {
  try {
    const centerId = Number(req.params.id)
    const temporaryPassword = `center${Math.floor(
      100000 + Math.random() * 900000
    )}`

    const [[center]] = await db.query(
      `SELECT id, name, user_id FROM centers WHERE id = ?`,
      [centerId]
    )

    if (!center) {
      return res.status(404).json({ error: 'Центр не найден' })
    }

    await db.query(
      `UPDATE users 
       SET password_hash = ?, first_login_required = 1
       WHERE id = ?`,
      [temporaryPassword, center.user_id]
    )

    await createLog(
      'Сброшен пароль центра',
      `Для центра "${center.name}" создан временный пароль.`,
      'system'
    )

    res.json({ temporaryPassword })
  } catch (error) {
    console.error('admin reset password error', error)
    res.status(500).json({ error: 'Ошибка сброса пароля' })
  }
})

router.get('/subscriptions', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, description, price, period_days, is_active
       FROM subscriptions
       WHERE is_active = 1
       ORDER BY price`
    )

    res.json(rows)
  } catch (error) {
    console.error('admin subscriptions error', error)
    res.status(500).json({ error: 'Ошибка загрузки тарифов' })
  }
})

router.get('/center-subscriptions', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
          cs.id,
          cs.center_id,
          c.name AS center_name,
          c.city,
          s.name AS subscription_name,
          s.price,
          cs.start_date,
          cs.end_date,
          cs.status
       FROM center_subscriptions cs
       JOIN centers c ON c.id = cs.center_id
       JOIN subscriptions s ON s.id = cs.subscription_id
       ORDER BY cs.end_date DESC, cs.id DESC`
    )

    res.json(rows)
  } catch (error) {
    console.error('admin center subscriptions error', error)
    res.status(500).json({ error: 'Ошибка загрузки подписок центров' })
  }
})

router.get('/applications', async (req, res) => {
  try {
    const { search, status } = req.query

    const params = []
    const where = []

    if (search) {
      where.push(
        `(center_name LIKE ? OR contact_person LIKE ? OR city LIKE ? OR phone LIKE ? OR email LIKE ?)`
      )
      params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      )
    }

    if (status) {
      where.push('status = ?')
      params.push(status)
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const [rows] = await db.query(
      `SELECT
          id,
          center_name,
          contact_person,
          phone,
          email,
          city,
          comment,
          status,
          created_at
       FROM center_applications
       ${whereSql}
       ORDER BY id DESC`,
      params
    )

    res.json(rows)
  } catch (error) {
    console.error('admin applications error', error)
    res.status(500).json({ error: 'Ошибка загрузки заявок' })
  }
})

router.patch('/applications/:id/status', async (req, res) => {
  try {
    const applicationId = Number(req.params.id)
    const { status } = req.body

    await db.query(
      `UPDATE center_applications 
       SET status = ?
       WHERE id = ?`,
      [status, applicationId]
    )

    const [rows] = await db.query(
      `SELECT
          id,
          center_name,
          contact_person,
          phone,
          email,
          city,
          comment,
          status,
          created_at
       FROM center_applications
       WHERE id = ?`,
      [applicationId]
    )

    const application = rows[0]

    if (!application) {
      return res.status(404).json({ error: 'Заявка не найдена' })
    }

    await createLog(
      'Статус заявки обновлён',
      `Заявка центра "${application.center_name}" получила статус "${applicationStatusText(
        application.status
      )}".`,
      'system'
    )

    res.json(application)
  } catch (error) {
    console.error('admin application status error', error)
    res.status(500).json({ error: 'Ошибка изменения статуса заявки' })
  }
})

router.get('/analytics', async (req, res) => {
  try {
    const { city } = req.query

    const params = []
    const cityWhere = city ? 'WHERE city LIKE ?' : ''

    if (city) {
      params.push(`%${city}%`)
    }

    const [centersByCity] = await db.query(
      `SELECT
          city,
          COUNT(*) AS total
       FROM centers
       ${cityWhere}
       GROUP BY city
       ORDER BY total DESC`,
      params
    )

    const [centersByStatus] = await db.query(
      `SELECT 'Активные' AS label, COUNT(*) AS total FROM centers WHERE is_active = 1
       UNION ALL
       SELECT 'Заблокированные' AS label, COUNT(*) AS total FROM centers WHERE is_active = 0
       UNION ALL
       SELECT 'На модерации' AS label, COUNT(*) AS total FROM centers WHERE moderation_status = 'pending'
       UNION ALL
       SELECT 'Одобренные' AS label, COUNT(*) AS total FROM centers WHERE moderation_status = 'approved'`
    )

    const [popularCategories] = await db.query(
      `SELECT
          a.category,
          COUNT(a.id) AS total
       FROM activities a
       JOIN centers c ON c.id = a.center_id
       ${city ? 'WHERE c.city LIKE ?' : ''}
       GROUP BY a.category
       ORDER BY total DESC`,
      city ? [`%${city}%`] : []
    )

    const [subscriptionsByTariff] = await db.query(
      `SELECT
          s.name,
          COUNT(cs.id) AS total
       FROM subscriptions s
       LEFT JOIN center_subscriptions cs 
          ON cs.subscription_id = s.id 
          AND cs.status = 'active'
          AND cs.end_date >= CURDATE()
       GROUP BY s.id, s.name
       ORDER BY total DESC`
    )

    res.json({
      centersByCity,
      centersByStatus,
      popularCategories,
      subscriptionsByTariff,
    })
  } catch (error) {
    console.error('admin analytics error', error)
    res.status(500).json({ error: 'Ошибка загрузки аналитики' })
  }
})

router.get('/logs', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
          id,
          title,
          message,
          type,
          created_at
       FROM notifications
       ORDER BY created_at DESC
       LIMIT 50`
    )

    res.json(rows)
  } catch (error) {
    console.error('admin logs error', error)
    res.status(500).json({ error: 'Ошибка загрузки логов' })
  }
})

function centerStatusText(status, isActive) {
  if (!isActive) return 'Заблокирован'

  const map = {
    draft: 'Черновик',
    pending: 'На модерации',
    approved: 'Одобрен',
    rejected: 'Отклонён',
  }

  return map[status] || 'Активен'
}

function applicationStatusText(status) {
  const map = {
    new: 'Новая',
    in_review: 'В работе',
    approved: 'Одобрена',
    rejected: 'Отклонена',
  }

  return map[status] || status
}

module.exports = router