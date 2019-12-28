'use strict'

const express = require('express')
const router = express.Router()
const DiaryUserController = require('../controllers/DiaryUserController')

router.get('/', (req, res) => {
  DiaryUserController.index(req.decoded)
    .then(result => {
      return res.json({ code: 200, error: false, result })
    })
    .catch(err => {
      return res
        .status(400)
        .json({ code: 400, error: true, message: err.message })
    })
})

module.exports = router
