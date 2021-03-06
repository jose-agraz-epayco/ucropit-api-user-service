import express from 'express'

import activitiesController from '../../controllers/ActivitiesController'
import ActivitiesNotificationsController from '../../controllers/ActivitiesNotificationsController'
import { getActivitiesLotsGroupedByTagsMiddleware } from '../../middlewares/activities'

const router: express.Router = express.Router()

/**
 * @swagger
 *  /v1/activities/subType:
 *    get:
 *      summary: Show all subTypes of activities
 *      parameters:
 *          - in: header
 *            name: Accept-Language
 *            type: string
 *            require: true
 *            enum: ['es', 'en', 'pt']
 *      tags: [Activity]
 *      responses:
 *        "200":
 *          description: Show success
 *        "404":
 *          description: Not Found Resources
 *        "500":
 *          description: Server error
 */
router.get('/subType', activitiesController.getAllSubtypes)

/**
 * @swagger
 * /v1/activities:
 *  get:
 *   summary: Get all activities
 *   tags:
 *      - Activity
 *   parameters:
 *       - in: query
 *         name: ids
 *         description: One or more IDs
 *         required: false
 *         schema:
 *          type: array
 *          items:
 *             type: string
 *         style: form
 *         explode: false
 *         examples:
 *          oneId:
 *            summary: Example of a single ID
 *            value: [5]   # ?ids=5
 *          multipleIds:
 *            summary: Example of multiple IDs
 *            value: [1, 5, 7]   # ?ids=1,5,7
 *   description: Activities
 *   produces:
 *     - application/json
 *   responses:
 *    '200':
 *      description: Get all Activities
 */
router.get('/', activitiesController.index)

/**
 * @swagger
 *  /v1/activities/{id}/lots/grouped-by-tags:
 *    get:
 *      summary: Show a activity with lots grouped by tags
 *      tags: [Activity]
 *      parameters:
 *        - in: path
 *          name: id
 *        - in: query
 *          name: cropId
 *      responses:
 *        "200":
 *          description: Show success
 *          content:
 *            application/json:
 *             schema:
 *              type: array
 *              items:
 *                $ref: '#/definitions/activitiesLotsGroupedByTagsObject'
 *        "404":
 *          description: Not Found Resources
 *        "500":
 *          description: Server error
 */
router.get(
  '/:id/lots/grouped-by-tags',
  [getActivitiesLotsGroupedByTagsMiddleware],
  activitiesController.showLotsGroupedByTags
)

/**
 * @swagger
 *  /v1/activities/{id}:
 *    get:
 *      summary: Show a activity
 *      tags: [Activity]
 *      parameters:
 *        - in: path
 *          name: id
 *      responses:
 *        "200":
 *          description: Show success
 *          content:
 *            application/json:
 *             schema:
 *                $ref: '#/components/schemas/Activity'
 *        "404":
 *          description: Not Found Resources
 *        "500":
 *          description: Server error
 */
router.get('/:id', activitiesController.show)

/**
 * @swagger
 *  /v1/activities:
 *    post:
 *      summary: Create a new Activity
 *      tags: [Activity]
 *      requestBody:
 *        content:
 *          multipart/form-data:
 *              schema:
 *               type: object
 *               properties:
 *                  data:
 *                     type: string
 *                     required: true
 *                     description: Data in JSON to convert in String
 *                  documents:
 *                       type: string
 *                       format: binary
 *                       required: false
 *                       description: Documents File
 *
 *      responses:
 *       '201':
 *         description: Create a new Activity.
 *         content:
 *         application/json:
 *             schema:
 *                $ref: '#/components/schemas/Activity'
 *
 *       '500':
 *         description: Error to Server.
 *
 */
router.post('/', activitiesController.create)

/**
 * @swagger
 *  /v1/activities/{id}:
 *    put:
 *      summary: Update a Activity
 *      tags: [Activity]
 *      parameters:
 *        - in: path
 *          name: id
 *      requestBody:
 *        content:
 *          multipart/form-data:
 *              schema:
 *               type: object
 *               properties:
 *                  data:
 *                     type: string
 *                     required: true
 *                     description: Data in JSON to convert in String
 *                  documents:
 *                       type: string
 *                       format: binary
 *                       required: false
 *                       description: Documents File
 *
 *      responses:
 *       '200':
 *         description: Create a new Activity.
 *         content:
 *         application/json:
 *             schema:
 *                $ref: '#/components/schemas/Activity'
 *
 *       '500':
 *         description: Error to Server.
 *
 */
router.put('/:id', activitiesController.update)

/**
 * @swagger
 *  /v1/activities/{id}/crops/{cropId}:
 *    put:
 *      summary: Update status Done in Activity
 *      tags: [Activity]
 *      parameters:
 *        - in: path
 *          name: id
 *        - in: path
 *          name: cropId
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  status:
 *                    type: string
 *
 *      responses:
 *       '200':
 *         description: Update status Ok.
 *         content:
 *         application/json:
 *             schema:
 *                $ref: '#/components/schemas/Activity'
 *
 *       '500':
 *         description: Error to Server.
 *
 */
router.put('/:id/crops/:cropId', activitiesController.validate)

/**
 * @swagger
 *  /v1/activities/{id}/crops/{cropId}/signed:
 *    put:
 *      summary: Sign User in Activity
 *      tags: [Activity]
 *      parameters:
 *        - in: path
 *          name: id
 *        - in: path
 *          name: cropId
 *      responses:
 *       '200':
 *         description: Signed Ok.
 *         content:
 *         application/json:
 *             schema:
 *                $ref: '#/components/schemas/Activity'
 *
 *       '500':
 *         description: Error to Server.
 *
 */
router.put('/:id/crops/:cropId/signed', activitiesController.sign)

/**
 * @swagger
 *  /v1/activities/{id}:
 *    delete:
 *      summary: Delete activity
 *      tags: [Activity]
 *      parameters:
 *        - in: path
 *          name: id
 *      responses:
 *        "200":
 *          description: Delete success
 *        "404":
 *          description: Not Found Resources
 *        "500":
 *          description: Server error
 */
router.delete('/:id', activitiesController.delete)

/**
 * @swagger
 *  /v1/activities/{id}/files/{fileId}:
 *    delete:
 *      summary: Delete file to activity
 *      tags: [Activity]
 *      parameters:
 *        - in: path
 *          name: id
 *        - in: path
 *          name: fileId
 *      responses:
 *        "200":
 *          description: deleted file successfully
 *        "404":
 *          description: Not Found File to delete
 *        "500":
 *          description: Server error
 */
router.delete('/:id/files/:fileId', activitiesController.removeFile)

/**
 * @swagger
 *  /v1/activities/{id}/files:
 *    delete:
 *      summary: Delete many files of activity
 *      tags: [Activity]
 *      parameters:
 *        - in: path
 *          name: id
 *      responses:
 *        "200":
 *          description: deleted files successfully
 *        "404":
 *          description: Not Found Files to delete
 *        "500":
 *          description: Server error
 */
router.delete('/:id/files', activitiesController.removeFiles)

/**
 * @swagger
 * /v1/activities/notify:
 *  post:
 *   security: []
 *   summary: send notification emails to all collaborators of the crop
 *   tags: [Auth]
 *   description: send notification emails to all collaborators of the crop
 *   requestBody:
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *            name:
 *              type: string
 *            activity:
 *              type: string
 *            cropname:
 *              type: string
 *            email:
 *              type: string
 */
router.post('/notify', ActivitiesNotificationsController.notify)

export default router
