// backend/routes/parent.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// В РЕАЛЕ ты будешь брать parentId из токена.
// Для простоты демо используем ?parentId=1
function getParentId(req) {
  const q = parseInt(req.query.parentId || "1", 10);
  return q;
}

/**
 * 2.1. Дашборд родителя:
 * - имя родителя
 * - количество детей
 * - количество активных записей
 * - ближайшие занятия (по всем детям)
 */
router.get("/dashboard", async (req, res) => {
  const parentId = getParentId(req);

  try {
    // Имя родителя
    const [parentRows] = await db.query(
      "SELECT full_name FROM parents WHERE id = ?",
      [parentId]
    );
    if (parentRows.length === 0) {
      return res.status(404).json({ error: "Родитель не найден" });
    }

    // Кол-во детей
    const [kidsRows] = await db.query(
      "SELECT COUNT(*) AS total FROM kids WHERE parent_id = ?",
      [parentId]
    );

    // Кол-во активных записей (approved/pending)
    const [enrollRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM enrollments e
       JOIN kids k ON e.kid_id = k.id
       WHERE k.parent_id = ?
         AND e.status IN ('approved','pending')`,
      [parentId]
    );

    // Ближайшие занятия: берём расписание групп + детей
    const [upcoming] = await db.query(
      `SELECT 
          k.full_name      AS kid_name,
          a.title          AS activity_title,
          c.name           AS center_name,
          s.weekday,
          s.start_time,
          s.end_time
       FROM enrollments e
       JOIN kids k            ON e.kid_id = k.id
       JOIN activity_groups g ON e.group_id = g.id
       JOIN activities a      ON g.activity_id = a.id
       JOIN centers c         ON a.center_id = c.id
       JOIN schedule_slots s  ON s.group_id = g.id
       WHERE k.parent_id = ?
         AND e.status = 'approved'
       ORDER BY s.weekday, s.start_time
       LIMIT 5`,
      [parentId]
    );

    res.json({
      parent_name: parentRows[0].full_name,
      kids_count: kidsRows[0].total,
      enrollments_count: enrollRows[0].total,
      upcoming,
    });
  } catch (error) {
    console.error("parent dashboard error", error);
    res.status(500).json({ error: "Ошибка дашборда родителя" });
  }
});

// в начале файла уже должно быть:
// const express = require("express");
// const router = express.Router();
// const pool = require("../db");

// ...

// СЛОТЫ КРУЖКОВ ДЛЯ РОДИТЕЛЯ (по kid_id + enrollments + schedule_slots)
router.get("/parent/activity-slots", async (req, res) => {
  try {
    const parentId = Number(req.query.parentId);
    if (!parentId) {
      return res.status(400).json({ error: "parentId is required" });
    }

    const [rows] = await pool.promise().query(
      `
      SELECT 
        e.id            AS enrollment_id,
        k.id            AS kid_id,
        k.full_name     AS kid_name,
        a.title         AS activity_title,
        c.name          AS center_name,
        ss.weekday      AS weekday,
        ss.start_time   AS start_time,
        ss.end_time     AS end_time
      FROM enrollments e
      JOIN kids k             ON e.kid_id = k.id
      JOIN activity_groups g  ON e.group_id = g.id
      JOIN activities a       ON g.activity_id = a.id
      JOIN centers c          ON a.center_id = c.id
      JOIN schedule_slots ss  ON ss.group_id = g.id
      WHERE k.parent_id = ?
        AND e.status = 'approved'
      ORDER BY ss.weekday, ss.start_time;
      `,
      [parentId]
    );

    res.json(rows);
  } catch (err) {
    console.error("activity-slots error", err);
    res.status(500).json({ error: "Failed to load activity slots" });
  }
});




/**
 * 2.2. Профиль родителя:
 * GET  /api/parent/profile
 * POST /api/parent/profile  (обновление)
 */
router.get("/profile", async (req, res) => {
  const parentId = getParentId(req);
  try {
    const [rows] = await db.query(
      `SELECT 
          p.full_name,
          p.city,
          p.phone,
          p.telegram,
          p.whatsapp,
          p.extra_email,
          p.avatar_url,
          u.email AS login_email
       FROM parents p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [parentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Профиль не найден" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("profile get error", error);
    res.status(500).json({ error: "Ошибка получения профиля" });
  }
});

router.post("/profile", async (req, res) => {
  const parentId = getParentId(req);
  const { city, phone, telegram, whatsapp, extra_email, avatar_url } = req.body;

  try {
    await db.query(
      `UPDATE parents
       SET city = ?, phone = ?, telegram = ?, whatsapp = ?, extra_email = ?, avatar_url = ?
       WHERE id = ?`,
      [city, phone, telegram, whatsapp, extra_email, avatar_url, parentId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("profile update error", error);
    res.status(500).json({ error: "Ошибка обновления профиля" });
  }
});

/**
 * 2.3. Дети:
 * GET  /api/parent/kids
 * POST /api/parent/kids   (добавить ребёнка)
 * PUT  /api/parent/kids/:id
 * DELETE /api/parent/kids/:id
 */
router.get("/kids", async (req, res) => {
  const parentId = getParentId(req);
  try {
    const [rows] = await db.query(
      `SELECT 
          id,
          full_name,
          birth_date,
          gender,
          photo_url
       FROM kids
       WHERE parent_id = ?
       ORDER BY created_at`,
      [parentId]
    );
    res.json(rows);
  } catch (error) {
    console.error("kids list error", error);
    res.status(500).json({ error: "Ошибка получения списка детей" });
  }
});

router.post("/kids", async (req, res) => {
  const parentId = getParentId(req);
  const { full_name, birth_date, gender, photo_url } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO kids (parent_id, full_name, birth_date, gender, photo_url)
       VALUES (?, ?, ?, ?, ?)`,
      [parentId, full_name, birth_date, gender || null, photo_url || null]
    );
    res.json({ id: result.insertId });
  } catch (error) {
    console.error("kids create error", error);
    res.status(500).json({ error: "Ошибка добавления ребёнка" });
  }
});

router.put("/kids/:id", async (req, res) => {
  const parentId = getParentId(req);
  const kidId = parseInt(req.params.id, 10);
  const { full_name, birth_date, gender, photo_url } = req.body;
  try {
    await db.query(
      `UPDATE kids
       SET full_name = ?, birth_date = ?, gender = ?, photo_url = ?
       WHERE id = ? AND parent_id = ?`,
      [full_name, birth_date, gender || null, photo_url || null, kidId, parentId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("kids update error", error);
    res.status(500).json({ error: "Ошибка обновления ребёнка" });
  }
});

router.delete("/kids/:id", async (req, res) => {
  const parentId = getParentId(req);
  const kidId = parseInt(req.params.id, 10);
  try {
    await db.query(
      `DELETE FROM kids WHERE id = ? AND parent_id = ?`,
      [kidId, parentId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("kids delete error", error);
    res.status(500).json({ error: "Ошибка удаления ребёнка" });
  }
});

/**
 * 2.4. Поиск кружков (упрощённо: без всех фильтров, но с привязкой к БД)
 * GET /api/activities/search?city=...&age=...&category=...
 */
router.get("/search-activities", async (req, res) => {
  const { city, age, category } = req.query;

  const params = [];
  let where = "a.is_active = 1";

  if (city) {
    where += " AND c.city = ?";
    params.push(city);
  }
  if (age) {
    where += " AND (a.min_age IS NULL OR a.min_age <= ?) AND (a.max_age IS NULL OR a.max_age >= ?)";
    params.push(age, age);
  }
  if (category) {
    where += " AND a.category = ?";
    params.push(category);
  }

  try {
    const [rows] = await db.query(
      `SELECT
          a.id,
          a.title,
          a.category,
          a.description,
          a.min_age,
          a.max_age,
          c.name   AS center_name,
          c.city   AS center_city,
          c.address,
          c.phone
       FROM activities a
       JOIN centers c ON a.center_id = c.id
       WHERE ${where}
       LIMIT 50`,
      params
    );
    res.json(rows);
  } catch (error) {
    console.error("search activities error", error);
    res.status(500).json({ error: "Ошибка поиска кружков" });
  }
});

/**
 * 2.5–2.6. Инфо по конкретному кружку + расписание
 */
router.get("/activities/:id", async (req, res) => {
  const activityId = parseInt(req.params.id, 10);
  try {
    const [[activity]] = await db.query(
      `SELECT
          a.*,
          c.name      AS center_name,
          c.city      AS center_city,
          c.address   AS center_address,
          c.phone     AS center_phone,
          c.website   AS center_website,
          c.instagram AS center_instagram
       FROM activities a
       JOIN centers c ON a.center_id = c.id
       WHERE a.id = ?`,
      [activityId]
    );
    if (!activity) {
      return res.status(404).json({ error: "Кружок не найден" });
    }

    const [slots] = await db.query(
      `SELECT
          s.weekday,
          s.start_time,
          s.end_time
       FROM activity_groups g
       JOIN schedule_slots s ON s.group_id = g.id
       WHERE g.activity_id = ?
       ORDER BY s.weekday, s.start_time`,
      [activityId]
    );

    res.json({ activity, slots });
  } catch (error) {
    console.error("activity details error", error);
    res.status(500).json({ error: "Ошибка получения данных кружка" });
  }
});

/**
 * 2.4/2.6. Запись на кружок (упрощённо, без сложной проверки пересечений)
 * POST /api/enrollments
 * body: { kid_id, group_id }
 */
router.post("/enroll", async (req, res) => {
  const { kid_id, group_id } = req.body;

  if (!kid_id || !group_id) {
    return res.status(400).json({ error: "Укажите ребёнка и группу" });
  }

  try {
    // TODO: здесь можно добавить проверку пересечения со school_lessons и другими schedule_slots

    await db.query(
      `INSERT INTO enrollments (kid_id, group_id, status)
       VALUES (?, ?, 'pending')
       ON DUPLICATE KEY UPDATE status = 'pending'`,
      [kid_id, group_id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("enroll error", error);
    res.status(500).json({ error: "Ошибка записи на кружок" });
  }
});



router.post("/school-lessons", async (req, res) => {
  const parentId = getParentId(req);
  const { kid_id, weekday, lesson_number, subject, classroom } = req.body;

  if (!kid_id || !weekday || !subject) {
    return res.status(400).json({ error: "Укажите ребёнка, день недели и предмет" });
  }

  try {
    // Проверим, что ребёнок принадлежит этому родителю
    const [check] = await db.query(
      "SELECT id FROM kids WHERE id = ? AND parent_id = ?",
      [kid_id, parentId]
    );
    if (!check.length) {
      return res.status(403).json({ error: "Нет доступа к этому ребёнку" });
    }

    await db.query(
      `INSERT INTO school_lessons (kid_id, weekday, lesson_number, subject, classroom)
       VALUES (?, ?, ?, ?, ?)`,
      [kid_id, weekday, lesson_number || null, subject, classroom || null]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("school lessons post error", error);
    res.status(500).json({ error: "Ошибка сохранения школьного расписания" });
  }
});

// ---------------------------------------------------------
// ШКОЛЬНОЕ РАСПИСАНИЕ + КРУЖКИ В ОДНОМ СПИСКЕ
// GET  /api/parent/school-lessons?parentId=1
// POST /api/parent/school-lessons?parentId=1  (добавить школьный урок)
// ---------------------------------------------------------

router.get("/school-lessons", async (req, res) => {
  const parentId = getParentId(req);

  try {
    // 1) ШКОЛА
    const [schoolRows] = await db.query(
      `SELECT
         sl.id            AS schedule_id,
         k.id             AS kid_id,
         k.full_name      AS kid_name,
         sl.weekday,
         sl.lesson_number,
         sl.start_time,
         sl.end_time,
         sl.subject       AS title,
         NULL             AS category,
         'school'         AS item_type
       FROM school_lessons sl
       JOIN kids k ON sl.kid_id = k.id
       WHERE k.parent_id = ?`,
      [parentId]
    );

    // 2) КРУЖКИ (одобренные записи ребёнка)
    const [activityRows] = await db.query(
      `SELECT
         ss.id            AS schedule_id,
         k.id             AS kid_id,
         k.full_name      AS kid_name,
         ss.weekday,
         NULL             AS lesson_number,
         ss.start_time,
         ss.end_time,
         a.title          AS title,
         a.category       AS category,
         'activity'       AS item_type
       FROM enrollments e
       JOIN kids k            ON e.kid_id = k.id
       JOIN activity_groups g ON e.group_id = g.id
       JOIN schedule_slots ss ON ss.group_id = g.id
       JOIN activities a      ON g.activity_id = a.id
       WHERE k.parent_id = ?
         AND e.status = 'approved'`,
      [parentId]
    );

    const all = [...schoolRows, ...activityRows].sort((a, b) => {
      if (a.weekday !== b.weekday) return a.weekday - b.weekday;
      const ta = a.start_time || "00:00:00";
      const tb = b.start_time || "00:00:00";
      return ta.localeCompare(tb);
    });

    res.json(all);
  } catch (err) {
    console.error("school-lessons get error", err);
    res.status(500).json({ error: "Ошибка получения расписания" });
  }
});

router.post("/school-lessons", async (req, res) => {
  const parentId = getParentId(req);
  const { kid_id, weekday, lesson_number, subject, start_time, end_time } =
    req.body;

  if (!kid_id || !weekday || !subject) {
    return res
      .status(400)
      .json({ error: "Нужно указать ребёнка, день недели и предмет" });
  }

  try {
    // Проверим, что ребёнок принадлежит этому родителю
    const [kidRows] = await db.query(
      "SELECT id FROM kids WHERE id = ? AND parent_id = ?",
      [kid_id, parentId]
    );
    if (!kidRows.length) {
      return res.status(403).json({ error: "Нет доступа к этому ребёнку" });
    }

    await db.query(
      `INSERT INTO school_lessons
         (kid_id, weekday, lesson_number, start_time, end_time, subject)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        kid_id,
        weekday,
        lesson_number || null,
        start_time || null,
        end_time || null,
        subject,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("school-lessons post error", err);
    res.status(500).json({ error: "Ошибка сохранения урока" });
  }
});

module.exports = router;
