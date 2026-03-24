// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// В реале тут должна быть проверка роли admin по токену.
// Пока — демо без авторизации.

/**
 * 4.1. Общий дашборд админа
 * GET /api/admin/dashboard
 */
router.get("/dashboard", async (req, res) => {
  try {
    const [[parentsCount]] = await db.query(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'parent'"
    );
    const [[kidsCount]] = await db.query("SELECT COUNT(*) AS total FROM kids");
    const [[centersCount]] = await db.query(
      "SELECT COUNT(*) AS total FROM centers"
    );
    const [[activitiesCount]] = await db.query(
      "SELECT COUNT(*) AS total FROM activities"
    );
    const [[activeSubs]] = await db.query(
      "SELECT COUNT(*) AS total FROM center_subscriptions WHERE is_active = 1"
    );

    // Простая динамика по месяцам (кол-во новых родителей)
    const [parentsByMonth] = await db.query(
      `SELECT 
          DATE_FORMAT(created_at, '%Y-%m-01') AS month,
          COUNT(*) AS total
       FROM users
       WHERE role = 'parent'
       GROUP BY month
       ORDER BY month`
    );

    // Новые заявки (enrollments) по месяцам
    let enrollmentsByMonth = [];
    try {
      const [rows] = await db.query(
        `SELECT 
            DATE_FORMAT(created_at, '%Y-%m-01') AS month,
            COUNT(*) AS total
         FROM enrollments
         GROUP BY month
         ORDER BY month`
      );
      enrollmentsByMonth = rows;
    } catch (err) {
      console.warn("enrollmentsByMonth error (нет created_at?):", err.message);
    }

    res.json({
      totals: {
        parents: parentsCount.total || 0,
        kids: kidsCount.total || 0,
        centers: centersCount.total || 0,
        activities: activitiesCount.total || 0,
        active_subscriptions: activeSubs.total || 0,
      },
      parents_by_month: parentsByMonth,
      enrollments_by_month: enrollmentsByMonth,
    });
  } catch (err) {
    console.error("admin dashboard error", err);
    res.status(500).json({ error: "Ошибка дашборда админа" });
  }
});

/**
 * 4.2. Управление центрами и подписками
 * GET  /api/admin/centers
 * POST /api/admin/centers/:id/status { is_active }
 * POST /api/admin/centers/:id/subscription { tariff_id, start_date, end_date }
 */
router.get("/centers", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
          c.id,
          c.name,
          c.city,
          c.is_active,
          COALESCE(cs.end_date, NULL) AS subscription_end,
          t.name  AS tariff_name,
          (SELECT COUNT(*) FROM activities a WHERE a.center_id = c.id) AS activities_count
       FROM centers c
       LEFT JOIN center_subscriptions cs 
              ON cs.center_id = c.id AND cs.is_active = 1
       LEFT JOIN tariff_plans t
              ON cs.tariff_id = t.id
       ORDER BY c.name`
    );
    res.json(rows);
  } catch (err) {
    console.error("admin centers list error", err);
    res.status(500).json({ error: "Ошибка получения списка центров" });
  }
});

router.post("/centers/:id/status", async (req, res) => {
  const centerId = parseInt(req.params.id, 10);
  const { is_active } = req.body;

  try {
    await db.query(`UPDATE centers SET is_active = ? WHERE id = ?`, [
      is_active ? 1 : 0,
      centerId,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("admin center status error", err);
    res.status(500).json({ error: "Ошибка изменения статуса центра" });
  }
});

router.post("/centers/:id/subscription", async (req, res) => {
  const centerId = parseInt(req.params.id, 10);
  const { tariff_id, start_date, end_date } = req.body;

  if (!tariff_id || !start_date || !end_date) {
    return res
      .status(400)
      .json({ error: "Нужно указать tariff_id, start_date, end_date" });
  }

  try {
    // выключаем предыдущие активные подписки
    await db.query(
      `UPDATE center_subscriptions
       SET is_active = 0
       WHERE center_id = ?`,
      [centerId]
    );

    // создаём новую
    await db.query(
      `INSERT INTO center_subscriptions
         (center_id, tariff_id, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [centerId, tariff_id, start_date, end_date]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("admin center subscription error", err);
    res.status(500).json({ error: "Ошибка обновления подписки центра" });
  }
});

/**
 * 4.3. Управление пользователями (родители)
 * GET /api/admin/parents
 */
router.get("/parents", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
          u.id,
          u.email,
          u.created_at,
          p.full_name,
          p.phone,
          p.city,
          (SELECT COUNT(*) FROM kids k WHERE k.parent_id = p.id) AS kids_count,
          (SELECT COUNT(*) 
             FROM enrollments e
             JOIN kids k2 ON e.kid_id = k2.id
            WHERE k2.parent_id = p.id
              AND e.status IN ('approved', 'pending')
          ) AS active_enrollments
       FROM users u
       JOIN parents p ON p.user_id = u.id
       WHERE u.role = 'parent'
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("admin parents list error", err);
    res.status(500).json({ error: "Ошибка получения списка родителей" });
  }
});

/**
 * 4.4. Простая аналитика
 * GET /api/admin/analytics
 */
router.get("/analytics", async (req, res) => {
  try {
    // дети по возрастным группам
    const [ageBuckets] = await db.query(
      `SELECT 
          CASE
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) < 4  THEN '0-3'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 4 AND 6 THEN '4-6'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 7 AND 10 THEN '7-10'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 11 AND 14 THEN '11-14'
            ELSE '15+'
          END AS age_group,
          COUNT(*) AS total
       FROM kids
       GROUP BY age_group
       ORDER BY age_group`
    );

    // популярность категорий кружков
    const [popularCategories] = await db.query(
      `SELECT 
          a.category,
          COUNT(*) AS enrollments_count
       FROM enrollments e
       JOIN activity_groups g ON e.group_id = g.id
       JOIN activities a      ON g.activity_id = a.id
       GROUP BY a.category
       ORDER BY enrollments_count DESC`
    );

    // города с наибольшим кол-вом центров
    const [centersByCity] = await db.query(
      `SELECT 
          city,
          COUNT(*) AS total
       FROM centers
       GROUP BY city
       ORDER BY total DESC`
    );

    res.json({
      age_buckets: ageBuckets,
      popular_categories: popularCategories,
      centers_by_city: centersByCity,
    });
  } catch (err) {
    console.error("admin analytics error", err);
    res.status(500).json({ error: "Ошибка аналитики" });
  }
});

module.exports = router;
