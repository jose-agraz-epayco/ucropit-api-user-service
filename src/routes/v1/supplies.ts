import express from 'express'

import suppliesController from '../../controllers/SuppliesController'

const router: express.Router = express.Router()

/**
 * @swagger
 * /v1/supplies:
 *  get:
 *   summary: Get all supplies list
 *   tags:
 *      - Supply
 *   parameters:
 *        - in: query
 *          name: queryFiltering
 *          required: false
 *          schema:
 *            type: string
 *        - in: query
 *          name: skip
 *          required: false
 *          schema:
 *            type: string
 *        - in: query
 *          name: alphaCode
 *          required: false
 *          schema:
 *            type: string
 *        - in: query
 *          name: activityType
 *          required: false
 *          schema:
 *            type: string
 *        - in: query
 *          name: cropType
 *          required: false
 *          schema:
 *            type: string
 *   description: Supplies
 *   produces:
 *     - application/json
 *   responses:
 *    '200':
 *      description: Get all Supplies
 *      content:
 *       application/json:
 *        schema:
 *          type: array
 *          items:
 *            $ref: '#/definitions/supplyObject'
 */
router.get('/', suppliesController.index)

/**
 * @swagger
 * /v1/supplies/quantities:
 *  get:
 *   summary: Get total documents supplies
 *   tags:
 *      - Supply
 *   parameters:
 *        - in: query
 *          name: alphaCode
 *          required: false
 *          schema:
 *            type: string
 *   description: Supplies
 *   produces:
 *     - application/json
 *   responses:
 *    '200':
 *      description: Get numbers of documents save in supplies collection
 */
router.get('/quantities', suppliesController.quantity)

export default router
