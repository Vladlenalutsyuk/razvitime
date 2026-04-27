const express = require('express')
const router = express.Router()
const db = require('../db')

/**
 * Получить все школьные уроки родителя
 */
router.get('/parent/school-lessons', async (req, res) => {
  const { userId } = req.query

  try {
    const [rows] = await db.query(
      `
      SELECT sl.*, c.name as child_name
      FROM school_lessons sl
      JOIN children c ON c.id = sl.child_id
      JOIN parent_profiles p ON p.id = c.parent_id
      WHERE p.user_id = ?
      ORDER BY sl.weekday, sl.start_time
    `,
      [userId]
    )

    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка загрузки школьного расписания' })
  }
})

/**
 * Добавить урок
 */
router.post('/school-lessons', async (req, res) => {
  const {
    child_id,
    weekday,
    lesson_number,
    start_time,
    end_time,
    subject,
    classroom,
  } = req.body

  try {
    const [result] = await db.query(
      `
      INSERT INTO school_lessons 
      (child_id, weekday, lesson_number, start_time, end_time, subject, classroom)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        child_id,
        weekday,
        lesson_number,
        start_time,
        end_time,
        subject,
        classroom,
      ]
    )

    const [rows] = await db.query(
      `SELECT * FROM school_lessons WHERE id = ?`,
      [result.insertId]
    )

    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка добавления урока' })
  }
})

/**
 * Обновить урок
 */
router.put('/school-lessons/:id', async (req, res) => {
  const { id } = req.params
  const {
    weekday,
    lesson_number,
    start_time,
    end_time,
    subject,
    classroom,
  } = req.body

  try {
    await db.query(
      `
      UPDATE school_lessons
      SET weekday=?, lesson_number=?, start_time=?, end_time=?, subject=?, classroom=?
      WHERE id=?
    `,
      [
        weekday,
        lesson_number,
        start_time,
        end_time,
        subject,
        classroom,
        id,
      ]
    )

    const [rows] = await db.query(
      `SELECT * FROM school_lessons WHERE id = ?`,
      [id]
    )

    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка обновления урока' })
  }
})

/**
 * Удалить урок
 */
router.delete('/school-lessons/:id', async (req, res) => {
  const { id } = req.params

  try {
    await db.query(`DELETE FROM school_lessons WHERE id = ?`, [id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка удаления урока' })
  }
})

module.exports = router