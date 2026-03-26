const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/', async (req, res) => {
  const userId = Number(req.query.userId)

  if (!userId) {
    return res.status(400).json({ error: 'Не передан userId' })
  }

  try {
    const [parentRows] = await db.query(
      `SELECT id
       FROM parent_profiles
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    )

    if (!parentRows.length) {
      return res.status(404).json({ error: 'Родитель не найден' })
    }

    const parentId = parentRows[0].id

    const [rows] = await db.query(
      `SELECT id, parent_id, name, birthdate, gender, photo_url, created_at
       FROM children
       WHERE parent_id = ?
       ORDER BY created_at DESC`,
      [parentId]
    )

    res.json(rows)
  } catch (error) {
    console.error('children get error', error)
    res.status(500).json({ error: 'Ошибка загрузки детей' })
  }
})

router.post('/', async (req, res) => {
  const { userId, name, birthdate, gender, photo_url } = req.body

  if (!userId || !name || !birthdate) {
    return res.status(400).json({ error: 'Не хватает обязательных полей' })
  }

  try {
    const [parentRows] = await db.query(
      `SELECT id
       FROM parent_profiles
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    )

    if (!parentRows.length) {
      return res.status(404).json({ error: 'Родитель не найден' })
    }

    const parentId = parentRows[0].id

    const [result] = await db.query(
      `INSERT INTO children (parent_id, name, birthdate, gender, photo_url)
       VALUES (?, ?, ?, ?, ?)`,
      [parentId, name, birthdate, gender || null, photo_url || null]
    )

    const [rows] = await db.query(
      `SELECT id, parent_id, name, birthdate, gender, photo_url, created_at
       FROM children
       WHERE id = ?`,
      [result.insertId]
    )

    res.status(201).json(rows[0])
  } catch (error) {
    console.error('children create error', error)
    res.status(500).json({ error: 'Ошибка создания ребёнка' })
  }
})

router.put('/:id', async (req, res) => {
  const childId = Number(req.params.id)
  const { name, birthdate, gender, photo_url } = req.body

  if (!childId) {
    return res.status(400).json({ error: 'Некорректный id ребёнка' })
  }

  try {
    await db.query(
      `UPDATE children
       SET name = ?, birthdate = ?, gender = ?, photo_url = ?
       WHERE id = ?`,
      [name, birthdate, gender || null, photo_url || null, childId]
    )

    const [rows] = await db.query(
      `SELECT id, parent_id, name, birthdate, gender, photo_url, created_at
       FROM children
       WHERE id = ?`,
      [childId]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Ребёнок не найден' })
    }

    res.json(rows[0])
  } catch (error) {
    console.error('children update error', error)
    res.status(500).json({ error: 'Ошибка обновления ребёнка' })
  }
})

router.delete('/:id', async (req, res) => {
  const childId = Number(req.params.id)

  if (!childId) {
    return res.status(400).json({ error: 'Некорректный id ребёнка' })
  }

  try {
    await db.query(
      `DELETE FROM children
       WHERE id = ?`,
      [childId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('children delete error', error)
    res.status(500).json({ error: 'Ошибка удаления ребёнка' })
  }
})

module.exports = router