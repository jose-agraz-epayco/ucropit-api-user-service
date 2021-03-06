/**
 * @swagger
 *  components:
 *    schemas:
 *       Approval:
 *         type: object
 *         required:
 *           - name
 *         properties:
 *           ots:
 *             type: string
 *           hash:
 *             type: string
 *           surface:
 *              type: number
 *           user:
 *              type: object
 *              schema:
 *                $ref: '#/components/schemas/User'
 *           file:
 *              type: object
 *              schema:
 *                $ref: '#/components/schemas/FileDocument'
 */
import mongoose from 'mongoose'
const { Schema } = mongoose

const ApprovalRegisterSignSchema = new Schema({
  ots: {
    type: String
  },
  hash: {
    type: String
  },
  activity: {
    type: Schema.Types.ObjectId,
    ref: 'Activity'
  },
  filePdf: {
    type: Schema.Types.ObjectId,
    ref: 'FileDocument'
  },
  fileOts: {
    type: Schema.Types.ObjectId,
    ref: 'FileDocument'
  }
})

export default mongoose.model(
  'ApprovalRegisterSign',
  ApprovalRegisterSignSchema
)
