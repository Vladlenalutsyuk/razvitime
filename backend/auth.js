// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * ПРОСТОЙ DEMO-ЛОГИН
 * Для учебного проекта:
 *   parent_demo@example.com  /  parent123
 *   center_demo@example.com  /  center123
 *
 * В БД пароли сейчас лежат как 'hashed_parent' и т.п.,
 * поэтому делаем проверку "вручную", без bcrypt.
 */

const DEMO_PASSWORDS = {
  parent: "parent123",
  center_admin: "center123",
};

router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  console.log("LOGIN BODY:", { email, password, role });

  if (!email || !password) {
    return res.status(400).json({ error: "Укажите e-mail и пароль" });
  }

  try {
    const [rows] = await db.query(
      `SELECT 
          u.id,
          u.role,
          p.full_name AS parent_name,
          c.title     AS center_title
       FROM users u
       LEFT JOIN parents p ON p.user_id = u.id
       LEFT JOIN centers c ON c.user_id = u.id
       WHERE u.email = ?`,
      [email]
    );

    console.log("FOUND ROWS:", rows);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Неверный логин или пароль" });
    }

    const user = rows[0];

    console.log("FOUND USER ROLE:", user.role);

    if (role && user.role !== role) {
      return res.status(401).json({ error: "Роль пользователя не совпадает" });
    }

    const expectedPassword = DEMO_PASSWORDS[user.role];
    console.log("EXPECTED PASSWORD:", expectedPassword);

    if (!expectedPassword || password !== expectedPassword) {
      return res.status(401).json({ error: "Неверный логин или пароль" });
    }

    await db.query(
      "UPDATE users SET last_login_at = NOW() WHERE id = ?",
      [user.id]
    );

    const demoToken = `demo-${user.role}-${user.id}`;

    res.json({
      token: demoToken,
      user: {
        id: user.id,
        role: user.role,
        name: user.parent_name || user.center_title || "Пользователь",
      },
    });
  } catch (error) {
    console.error("auth error", error);
    res.status(500).json({ error: "Ошибка сервера при входе" });
  }
});
module.exports = router;
