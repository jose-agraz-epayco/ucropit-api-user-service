/**
 * @swagger
 *  components:
 *    schemas:
 *       Activity:
 *         type: object
 *         required:
 *           - name
 *         properties:
 *           name:
 *             type: string
 *           dateStart:
 *             type: string
 *             format: date
 *           dateEnd:
 *             type: string
 *             format: date
 *           dateLimitValidation:
 *             type: string
 *             format: date
 *           surface:
 *              type: number
 *           status:
 *              type: string
 *           collaborators:
 *              type: array
 *           type:
 *              type: object
 *              schema:
 *                $ref: '#/components/schemas/ActivityType'
 *           typeAgreement:
 *              type: object
 *              schema:
 *                $ref: '#/components/schemas/TypeAgreement'
 *           crop:
 *              type: object
 *              schema:
 *                $ref: '#/components/schemas/Crop'
 *           lots:
 *              type: array
 *           supplies:
 *              type: array
 *           evidence:
 *              type: array
 *           files:
 *              type: array
 */
import mongoose from 'mongoose'
import shortid from 'shortid'

const { Schema } = mongoose

const ActivitySchema = new Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: false },
  key: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: true
  },
  dateStart: {
    type: Date,
    required: false
  },
  dateEnd: {
    type: Date,
    required: false
  },
  dateHarvest: {
    type: Date
  },
  dateLimitValidation: {
    type: Date,
    required: false
  },
  dateObservation: {
    type: Date
  },
  dateEstimatedHarvest: {
    type: Date,
    required: false
  },
  observation: {
    type: String
  },
  unitType: {
    type: Schema.Types.ObjectId,
    ref: 'UnitType'
  },
  envImpactIndice: {
    type: Schema.Types.ObjectId,
    ref: 'EnvImpactIndice',
  },
  pay: {
    type: Number
  },
  surface: {
    type: Number,
    required: false
  },
  status: [
    {
      name: {
        en: {
          type: String,
          default: 'TO_COMPLETE'
        },
        es: {
          type: String,
          default: 'COMPLETAR'
        }
      }
    }
  ],
  signers: [
    {
      userId: {
        type: Schema.Types.ObjectId
      },
      fullName: {
        type: String
      },
      email: {
        type: String
      },
      type: {
        type: String
      },
      signed: {
        type: Boolean,
        default: false
      },
      dateSigned: {
        type: Date
      }
    }
  ],
  approvalRegister: {
    type: Schema.Types.ObjectId,
    ref: 'ApprovalRegisterSign'
  },
  type: {
    type: Schema.Types.ObjectId,
    ref: 'ActivityType'
  },
  typeAgreement: {
    type: Schema.Types.ObjectId,
    ref: 'TypeAgreement'
  },
  lots: [{ type: Schema.Types.ObjectId, ref: 'Lot' }],
  lotsMade: [{ type: Schema.Types.ObjectId, ref: 'Lot' }],
  supplies: [
    {
      name: {
        type: String
      },
      unit: {
        type: String
      },
      quantity: {
        type: Number
      },
      typeId: {
        type: Schema.Types.ObjectId,
        ref: 'SupplyType'
      },
      supply: {
        type: Schema.Types.ObjectId,
        ref: 'Supply'
      },
      icon: {
        type: String
      },
      total: {
        type: Number
      }
    }
  ],
  storages: [
    {
      unitType: {
        type: Schema.Types.ObjectId,
        ref: 'UnitType'
      },
      tonsHarvest: {
        type: Number
      },
      storageType: {
        type: Schema.Types.ObjectId,
        ref: 'TypeStorage'
      },
      label: {
        type: String
      }
    }
  ],
  files: [{ type: Schema.Types.ObjectId, ref: 'FileDocument' }],
  achievements: [{ type: Schema.Types.ObjectId, ref: 'Achievement' }],
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  synchronizedList: [
    {
      service: {
        type: String
      },
      isSynchronized: {
        type: Boolean,
        default: false
      }
    }
  ]
})

ActivitySchema.pre('save', async function (next) {
  let activity: any = this
  /** Generate unique key */
  if (!activity.key) {
    activity.key = shortid.generate()
  }
})

ActivitySchema.methods.isDone = function () {
  let activity: any = this
  return activity.status[0].name.en === 'DONE'
}

ActivitySchema.methods.setExpired = function () {
  let activity: any = this
  activity.status[0].name.en = 'EXPIRED'
  activity.status[0].name.es = 'VENCIDA'
}

export default mongoose.model('Activity', ActivitySchema)
