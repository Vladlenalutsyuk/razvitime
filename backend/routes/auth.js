// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * Простая демо-авторизация.
 * Ожидает: { email, password, role }
 * Для учебного проекта можем не проверять реальный password_hash,
 * а просто принимать нужные логины.
 */
router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  console.log("LOGIN BODY:", { email, password, role });

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Укажите email, пароль и роль" });
  }

  try {
    if (email === "center_demo@example.com" && role === "center_admin" && password === "center123") {
  return res.json({
    token: "demo-token-center",
    user: {
      user_id: 999,
      role: "center_admin",
      parent_id: null,
      parent_name: null,
      center_id: 1,
      center_name: "Демо центр",
    },
  });
}
    const [rows] = await db.query(
      `SELECT u.id AS user_id, u.role,
              p.id AS parent_id, p.full_name AS parent_name,
              c.id AS center_id, c.name AS center_name
       FROM users u
       LEFT JOIN parents p ON p.user_id = u.id
       LEFT JOIN centers c ON c.user_id = u.id
       WHERE u.email = ? AND u.role = ?
       LIMIT 1`,
      [email, role]
    );

    console.log("FOUND ROWS:", rows);

    if (!rows.length) {
      return res.status(401).json({ error: "Неверные данные для входа" });
    }

    const u = rows[0];
    console.log("FOUND USER:", u);

    if (role === "parent" && password !== "parent123") {
      return res.status(401).json({ error: "Неверный пароль родителя (используйте parent123)" });
    }
    if (role === "center_admin" && password !== "center123") {
      return res.status(401).json({ error: "Неверный пароль центра (используйте center123)" });
    }

    const userPayload = {
      user_id: u.user_id,
      role: u.role,
      parent_id: u.parent_id || null,
      parent_name: u.parent_name || null,
      center_id: u.center_id || null,
      center_name: u.center_name || null,
    };

    res.json({
      token: "demo-token-" + u.user_id,
      user: userPayload,
    });
  } catch (error) {
    console.error("auth login error", error);
    res.status(500).json({ error: "Ошибка авторизации" });
  }
});

module.exports = router;
