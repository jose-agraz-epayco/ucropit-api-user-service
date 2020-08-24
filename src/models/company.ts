/**
 * @swagger
 *  components:
 *    schemas:
 *       Company:
 *         type: object
 *         required:
 *           - identifier
 *           - typePerson
 *           - name
 *           - address
 *           - addressFloor
 *         properties:
 *           name:
 *             type: string
 *           typePerson:
 *             type: string
 *           address:
 *             type: string
 *           addressFloor:
 *             type: string
 */
import mongoose from 'mongoose'

const { Schema } = mongoose

const CompanySchema = new Schema({
  identifier: {
    type: String,
    require: true,
    unique: true
  },
  typePerson: {
    type: String,
    enum: ['PHYSICAL_PERSON', 'LEGAL_PERSON'],
    default: 'PHYSICAL_PERSON'
  },
  name: {
    type: String,
    require: true
  },
  address: {
    type: String,
    require: true
  },
  addressFloor: {
    type: String,
    require: false
  }
})

export default mongoose.model('Company', CompanySchema)