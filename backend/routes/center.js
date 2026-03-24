// backend/routes/center.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// В реале центрId нужно вытаскивать из токена пользователя (user_id → centers.id).
// Для демо берём ?centerId=1, если не указано.
function getCenterId(req) {
  const q = parseInt(req.query.centerId || "1", 10);
  return q;
}

/**
 * 3.1. Дашборд центра
 * GET /api/center/dashboard?centerId=1
 *
 * Возвращает:
 * - название центра
 * - кол-во кружков (activities)
 * - кол-во заявок за последние 30 дней
 * - активную подписку (center_subscriptions + tariff_plans)
 * - несколько последних заявок
 */
router.get("/dashboard", async (req, res) => {
  const centerId = getCenterId(req);

  try {
    // 1. Центр
    const [centerRows] = await db.query(
      "SELECT id, name, city FROM centers WHERE id = ?",
      [centerId]
    );
    if (centerRows.length === 0) {
      return res.status(404).json({ error: "Центр не найден" });
    }
    const center = centerRows[0];

    // 2. Кол-во кружков
    const [[actCount]] = await db.query(
      "SELECT COUNT(*) AS total FROM activities WHERE center_id = ?",
      [centerId]
    );

    // 3. Кол-во заявок за 30 дней
    const [[reqCount]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM enrollments e
       JOIN activity_groups g ON e.group_id = g.id
       JOIN activities a      ON g.activity_id = a.id
       WHERE a.center_id = ?
         AND e.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [centerId]
    ).catch(async (err) => {
      // если в таблице enrollments нет created_at — посчитаем вообще все
      console.warn("dashboard enrollments 30d error, fallback:", err.message);
      const [[fallback]] = await db.query(
        `SELECT COUNT(*) AS total
         FROM enrollments e
         JOIN activity_groups g ON e.group_id = g.id
         JOIN activities a      ON g.activity_id = a.id
         WHERE a.center_id = ?`,
        [centerId]
      );
      return [fallback];
    });

    // 4. Активная подписка
    const [subRows] = await db.query(
      `SELECT 
          cs.id,
          cs.start_date,
          cs.end_date,
          cs.is_active,
          t.code       AS tariff_code,
          t.name       AS tariff_name,
          t.price_month
       FROM center_subscriptions cs
       JOIN tariff_plans t ON cs.tariff_id = t.id
       WHERE cs.center_id = ?
       ORDER BY cs.is_active DESC, cs.end_date DESC
       LIMIT 1`,
      [centerId]
    );

    // 5. Последние заявки
    const [latestEnrollments] = await db.query(
      `SELECT 
          e.id,
          e.status,
          e.created_at,
          e.comment,
          k.full_name      AS kid_name,
          a.title          AS activity_title
       FROM enrollments e
       JOIN kids k            ON e.kid_id = k.id
       JOIN activity_groups g ON e.group_id = g.id
       JOIN activities a      ON g.activity_id = a.id
       WHERE a.center_id = ?
       ORDER BY e.created_at DESC
       LIMIT 5`,
      [centerId]
    ).catch(() => [[], []]); // если нет created_at — просто пусто

    res.json({
      center_name: center.name,
      center_city: center.city,
      activities_count: actCount.total || 0,
      requests_last_30d: reqCount.total || 0,
      subscription: subRows[0] || null,
      latest_enrollments: latestEnrollments || [],
    });
  } catch (err) {
    console.error("center dashboard error", err);
    res.status(500).json({ error: "Ошибка дашборда центра" });
  }
});

/**
 * 3.2. Профиль центра
 * GET  /api/center/profile?centerId=1
 * POST /api/center/profile?centerId=1
 */
router.get("/profile", async (req, res) => {
  const centerId = getCenterId(req);
  try {
    const [rows] = await db.query(
      `SELECT 
          name,
          description,
          city,
          address,
          phone,
          whatsapp,
          website,
          instagram
       FROM centers
       WHERE id = ?`,
      [centerId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Центр не найден" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("center profile get error", err);
    res.status(500).json({ error: "Ошибка получения профиля центра" });
  }
});

router.post("/profile", async (req, res) => {
  const centerId = getCenterId(req);
  const { name, description, city, address, phone, whatsapp, website, instagram } =
    req.body;

  try {
    await db.query(
      `UPDATE centers
       SET name = COALESCE(?, name),
           description = ?,
           city = ?,
           address = ?,
           phone = ?,
           whatsapp = ?,
           website = ?,
           instagram = ?
       WHERE id = ?`,
      [
        name || null,
        description || null,
        city || null,
        address || null,
        phone || null,
        whatsapp || null,
        website || null,
        instagram || null,
        centerId,
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("center profile update error", err);
    res.status(500).json({ error: "Ошибка обновления профиля центра" });
  }
});

/**
 * 3.3. Кружки центра (activities)
 *
 * GET    /api/center/activities?centerId=1
 * POST   /api/center/activities?centerId=1
 * PUT    /api/center/activities/:id?centerId=1
 * DELETE /api/center/activities/:id?centerId=1
 */

// список кружков
router.get("/activities", async (req, res) => {
  const centerId = getCenterId(req);
  try {
    const [rows] = await db.query(
      `SELECT 
          a.id,
          a.title,
          a.category,
          a.description,
          a.min_age,
          a.max_age,
          a.level,
          a.is_active,
          COUNT(DISTINCT e.id) AS enrollments_count
       FROM activities a
       LEFT JOIN activity_groups g ON g.activity_id = a.id
       LEFT JOIN enrollments e     ON e.group_id = g.id
       WHERE a.center_id = ?
       GROUP BY a.id
       ORDER BY a.title`,
      [centerId]
    );
    res.json(rows);
  } catch (err) {
    console.error("center activities list error", err);
    res.status(500).json({ error: "Ошибка получения списка кружков" });
  }
});

// добавить кружок (без расписания, только сама запись activities)
router.post("/activities", async (req, res) => {
  const centerId = getCenterId(req);
  const { title, category, description, min_age, max_age, level, is_active } =
    req.body;

  if (!title) {
    return res.status(400).json({ error: "Укажите название кружка" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO activities
         (center_id, title, category, description, min_age, max_age, level, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        centerId,
        title,
        category || null,
        description || null,
        min_age || null,
        max_age || null,
        level || null,
        is_active === false ? 0 : 1,
      ]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("center activities create error", err);
    res.status(500).json({ error: "Ошибка создания кружка" });
  }
});

// редактирование кружка
router.put("/activities/:id", async (req, res) => {
  const centerId = getCenterId(req);
  const activityId = parseInt(req.params.id, 10);

  const { title, category, description, min_age, max_age, level, is_active } =
    req.body;

  try {
    const [result] = await db.query(
      `UPDATE activities
       SET title = COALESCE(?, title),
           category = ?,
           description = ?,
           min_age = ?,
           max_age = ?,
           level = ?,
           is_active = ?
       WHERE id = ? AND center_id = ?`,
      [
        title || null,
        category || null,
        description || null,
        min_age || null,
        max_age || null,
        level || null,
        is_active === false ? 0 : 1,
        activityId,
        centerId,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Кружок не найден" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("center activities update error", err);
    res.status(500).json({ error: "Ошибка обновления кружка" });
  }
});

// удалить кружок
router.delete("/activities/:id", async (req, res) => {
  const centerId = getCenterId(req);
  const activityId = parseInt(req.params.id, 10);

  try {
    const [result] = await db.query(
      `DELETE FROM activities WHERE id = ? AND center_id = ?`,
      [activityId, centerId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Кружок не найден" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("center activities delete error", err);
    res.status(500).json({ error: "Ошибка удаления кружка" });
  }
});

/**
 * 3.4. Заявки на запись
 *
 * GET  /api/center/enrollments?centerId=1&status=pending&activityId=...
 * POST /api/center/enrollments/:id/status  { status, comment }
 */
router.get("/enrollments", async (req, res) => {
  const centerId = getCenterId(req);
  const { status, activityId } = req.query;

  const params = [centerId];
  let where = "a.center_id = ?";

  if (status) {
    where += " AND e.status = ?";
    params.push(status);
  }
  if (activityId) {
    where += " AND a.id = ?";
    params.push(parseInt(activityId, 10));
  }

  try {
    const [rows] = await db.query(
      `SELECT 
          e.id,
          e.status,
          e.comment,
          e.created_at,
          k.full_name      AS kid_name,
          k.birth_date,
          p.full_name      AS parent_name,
          p.phone          AS parent_phone,
          u.email          AS parent_email,
          a.title          AS activity_title
       FROM enrollments e
       JOIN kids k            ON e.kid_id = k.id
       JOIN parents p         ON k.parent_id = p.id
       JOIN users u           ON p.user_id = u.id
       JOIN activity_groups g ON e.group_id = g.id
       JOIN activities a      ON g.activity_id = a.id
       WHERE ${where}
       ORDER BY e.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error("center enrollments list error", err);
    res.status(500).json({ error: "Ошибка получения заявок" });
  }
});

router.post("/enrollments/:id/status", async (req, res) => {
  const enrollmentId = parseInt(req.params.id, 10);
  const { status, comment } = req.body;

  if (!["pending", "approved", "rejected", "waitlist"].includes(status)) {
    return res.status(400).json({ error: "Некорректный статус" });
  }

  try {
    await db.query(
      `UPDATE enrollments
       SET status = ?, comment = ?
       WHERE id = ?`,
      [status, comment || null, enrollmentId]
    );
    // TODO: здесь можно отправлять уведомления родителю
    res.json({ success: true });
  } catch (err) {
    console.error("center enrollment status update error", err);
    res.status(500).json({ error: "Ошибка изменения статуса заявки" });
  }
});

module.exports = router;
