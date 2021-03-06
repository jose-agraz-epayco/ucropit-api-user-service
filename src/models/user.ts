/**
 * @swagger
 *  components:
 *    schemas:
 *      User:
 *        type: object
 *        required:
 *          - firstName
 *          - lastName
 *          - email
 *          - phone
 *        properties:
 *          firstName:
 *            type: string
 *          lastName:
 *            type: string
 *          phone:
 *           type: string
 *          email:
 *            type: string
 *            format: email
 *            description: Email for the user, needs to be unique.
 *        example:
 *           firstName: jhon
 *           lastName: doe
 *           phone: 342345123
 *           email: fake@email.com
 */
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { hashPassword } from '../utils/auth'

const SALT_WORK_FACTOR = 10

const { Schema } = mongoose

export interface UserSchema extends mongoose.Document {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  pin?: string
  verifyToken?: string
  companies?: Array<any>
  config?: string | any
}

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },
    phone: {
      type: String
    },
    email: {
      type: String,
      unique: true
    },
    pin: {
      type: String
    },
    verifyToken: {
      type: String
    },
    isInactive: {
      type: Boolean,
      default: false
    },
    avatar: { type: String, required: false },
    collaboratorRequest: [
      {
        type: Schema.Types.ObjectId,
        ref: 'CollaboratorRequest'
      }
    ],
    companies: [
      {
        company: {
          type: Schema.Types.ObjectId,
          ref: 'Company'
        },
        isAdmin: {
          type: Boolean,
          default: true
        },
        identifier: String
      }
    ],
    config: { type: Schema.Types.ObjectId, ref: 'UserConfig' }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

userSchema.virtual('avatarPath').get(function () {
  if (this.avatar) {
    return `${process.env.BASE_URL}/${this.avatar}`
  }
  return ''
})

userSchema.pre('save', async function (next) {
  const user = this

  if (!user.isModified('pin') && !user.isModified('verifyToken')) {
    return next()
  }
  const fieldChanged: string = user.isModified('pin') ? 'pin' : 'verifyToken'

  if (user[fieldChanged] === null) {
    next()
  }

  try {
    user[fieldChanged] = await hashPassword(
      user[fieldChanged],
      SALT_WORK_FACTOR
    )
    return next()
  } catch (error) {
    return next(error)
  }
})

userSchema.methods.comparePassword = function (
  candidatePassword,
  field: string,
  cb: Function
) {
  if (!this[field]) return cb(null, false)

  const fieldToCompare: string = this[field]
  bcrypt.compare(
    candidatePassword,
    fieldToCompare,
    function (err, isMatch: boolean) {
      if (err) return cb(err)
      cb(null, isMatch)
    }
  )
}

userSchema.methods.generateAuthToken = function (): string {
  const payload = { id: this._id }
  const token = jwt.sign(payload, process.env.AUTH_KEY_JWT)

  return token
}

export default mongoose.model<UserSchema>('User', userSchema)
