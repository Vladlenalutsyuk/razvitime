const express = require('express')
const router = express.Router()
const db = require('../db')

router.post('/', async (req, res) => {
  const { center_name, contact_person, phone, email, city, comment } = req.body

  if (!center_name || !contact_person || !phone) {
    return res.status(400).json({
      error: 'Заполните название центра, контактное лицо и телефон',
    })
  }

  try {
    await db.query(
      `INSERT INTO center_applications
        (center_name, contact_person, phone, email, city, comment, status)
       VALUES (?, ?, ?, ?, ?, ?, 'new')`,
      [
        center_name.trim(),
        contact_person.trim(),
        phone.trim(),
        email?.trim() || null,
        city?.trim() || null,
        comment?.trim() || null,
      ]
    )

    res.status(201).json({
      message: 'Заявка отправлена',
    })
  } catch (error) {
    console.error('center application error', error)
    res.status(500).json({
      error: 'Ошибка сервера при отправке заявки',
    })
  }
})

module.exports = router