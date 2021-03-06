import { ObjectId } from 'mongoose'
import { UnitType } from '../unitType'
import { UserAuth } from '../users'

export interface Activity {
  _id?: string | ObjectId | any
  id: string
  key: string
  name?: string
  dateStart: Date
  dateEnd: Date
  dateHarvest: Date
  dateLimitValidation: Date
  dateObservation: Date
  dateEstimatedHarvest: Date
  observation: string
  unitType: UnitType
  envImpactIndex: any
  pay: number
  surface: number
  status: any
  signers: any
  approvalRegister: any
  type: any
  typeAgreement: any
  lots: any[]
  lotsWithSurface?: any[]
  lotsMade: any[]
  supplies: any[]
  storages: any[]
  files: any[]
  achievements: any[]
  user: UserAuth
  isSynchronized: boolean
}
