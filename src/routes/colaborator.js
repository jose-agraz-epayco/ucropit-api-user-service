'use strict'

const express = require('express')
const router = express.Router()
const ColaboratorController = require('../controllers/ColaboratorController')

router.post('/productions/:cropId/:stage/:fieldId/:type', (req, res) => {
  const { cropId, stage, fieldId, type } = req.params
  ColaboratorController.addColaboratorEvent(
    req.body,
    cropId,
    stage,
    fieldId,
    type,
    req.decoded
  )
    .then((result) => {
      return res.json({ code: 200, error: false, result })
    })
    .catch((err) => {
      return res
        .status(400)
        .json({ code: 400, error: true, message: err.message })
    })
})

router.post('/:cropId/add', (req, res) => {
  const { cropId } = req.params
  ColaboratorController.addColaboratorGlobal(req.body, cropId, req.decoded)
    .then((result) => {
      return res.json({ code: 201, error: false, result })
    })
    .catch((error) => {
      return res
        .status(400)
        .json({ code: 400, error: true, message: error.message })
    })
})

/**
 * Quitar priviegios de firmar para todo los eventos de un stage en particular.
 */
router.delete('/productions/:cropId/stage/:stage/users/:userId', (req, res) => {
  const { cropId, stage, userId } = req.params

  ColaboratorController.removeStage(cropId, stage, userId)
    .then((result) => {
      return res.json({ code: 200, error: false, result })
    })
    .catch((error) => {
      return res
        .status(400)
        .json({ code: 400, error: true, message: error.message })
    })
})


/**
 * Quitar privilegios de firma de colaboradores en un evento especifico.
 */
router.delete(
  '/productions/:cropId/:stage/:fieldId/:type/users/:userId',
  (req, res) => {
    const { cropId, stage, fieldId, type, userId } = req.params
    ColaboratorController.removeEvent(cropId, stage, fieldId, type, userId)
      .then((result) => {
        return res.json({ code: 200, error: false, result })
      })
      .catch((err) => {
        return res
          .status(400)
          .json({ code: 400, error: true, message: err.message })
      })
  }
)

module.exports = router
