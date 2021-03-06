import mongoose from 'mongoose'
import { Signer } from '../interfaces'
import models from '../models'
import { statusActivities } from '../utils/Status'
import ServiceBase from './common/ServiceBase'
import { ActivityRepository } from '../repositories'

const Activity = models.Activity
const ActivityType = models.ActivityType
const TypeAgreement = models.TypeAgreement

interface IActivity {
  _id?: string
  name?: string
  dateStart?: string
  dateEnd?: string
  surface?: number
  type?: string
  crop?: string
  lots?: Array<any>
  dateLimitValidation?: string
  typeAgreement?: string
  supplies?: Array<any>
  evidences?: Array<any>
  status?: string | Array<any>
  user?: string
  subTypeActivity?: string
}

class ActivityService extends ServiceBase {
  public static async findActivityById(id: string): Promise<any> {
    return Activity.findById(id)
      .populate('type')
      .populate('typeAgreement')
      .populate({
        path: 'crop',
        populate: [
          { path: 'cropType' },
          { path: 'unitType' },
          { path: 'company' },
          { path: 'owner' }
        ]
      })
      .populate('lots')
      .populate({
        path: 'lotsWithSurface',
        populate: { path: 'lot' }
      })
      .populate('lotsMade')
      .populate('files')
      .populate({
        path: 'achievements',
        populate: [
          { path: 'lots' },
          { path: 'files' },
          { path: 'supplies', populate: [{ path: 'typeId' }] }
        ]
      })
      .populate('approvalRegister')
      .populate('user')
  }

  public static async getActivities(): Promise<any> {
    return Activity.find()
      .populate('type')
      .populate('typeAgreement')
      .populate({ path: 'lots' })
      .populate({ path: 'lotsMade' })
      .populate({
        path: 'achievements',
        populate: [
          { path: 'lots' },
          { path: 'supplies', populate: [{ path: 'typeId' }] }
        ]
      })
      .lean()
  }

  public static async getActivitiesByIds(ids: Array<string>): Promise<any> {
    return Activity.find()
      .populate('type')
      .populate('typeAgreement')
      .populate({
        path: 'crop',
        populate: [
          { path: 'cropType' },
          { path: 'unitType' },
          { path: 'company' },
          { path: 'owner' }
        ]
      })
      .populate({ path: 'lots' })
      .populate({ path: 'lotsMade', select: '-area -__v' })
      .populate('files')
      .populate({
        path: 'achievements',
        populate: [
          { path: 'lots', select: '-area -__v' },
          { path: 'files' },
          { path: 'supplies', populate: [{ path: 'typeId' }] }
        ]
      })
      .populate('approvalRegister')
      .populate('user')
      .where('_id')
      .in(ids)
      .lean()
  }

  public static async store(activity, user) {
    let statusActivity: Array<any> = []
    if (!this.existStatus(activity)) {
      statusActivity = this.createStatus('COMPLETAR')
      activity.status = statusActivity
    }

    if (this.existStatus(activity)) {
      statusActivity = this.createStatus(activity.status)
      activity.status = statusActivity
    }

    activity.user = user._id

    if (!activity._id) {
      activity._id = mongoose.Types.ObjectId()
    }

    const activityModel = await Activity.create(activity)

    return this.findActivityById(activityModel._id)
  }

  public static async update(id: string, activity: IActivity): Promise<any> {
    let statusActivity: Array<any> = []

    if (this.existStatus(activity)) {
      statusActivity = this.createStatus(activity.status)
      activity.status = statusActivity
    }

    await Activity.findByIdAndUpdate(id, activity)

    return Activity.findOne({ _id: id })
  }

  public static async updateSigners(
    signers: Signer[],
    activityId: string
  ): Promise<void> {
    await Activity.updateOne(
      { _id: activityId },
      { $set: { signers: signers } }
    )
  }

  public static async getByTag(tag: string) {
    return ActivityType.findOne({ tag })
  }

  public static createDefault(surface: number, date: string, user) {
    const typesActivity = ['ACT_SOWING', 'ACT_HARVEST', 'ACT_AGREEMENTS']

    const activities = typesActivity.map(async (item) => {
      const type = await this.getByTag(item)
      const typeAgreement = await TypeAgreement.findOne({ key: 'EXPLO' })
      const activity = await this.store(
        {
          name: this.createNameActivity(type),
          surface,
          dateLimitValidation: item === 'ACT_AGREEMENTS' ? date : null,
          typeAgreement: item === 'ACT_AGREEMENTS' ? typeAgreement._id : null,
          type: type._id
        },
        user
      )

      return activity._id
    })

    return Promise.all(activities)
  }

  public static async changeStatus(activity, status: string) {
    const statusChanged = statusActivities(status)

    activity.status = statusChanged

    return activity.save()
  }

  public static async signUserAndUpdateSing(activity, user) {
    const signer = activity.signers.filter(
      (item) => item.userId.toString() === user._id.toString()
    )

    if (signer.length > 0) {
      const child = activity.signers.id(signer[0]._id)
      child.signed = true
      child.dateSigned = new Date()
    }

    await activity.save()

    return Activity.findById(activity._id)
      .populate('lots')
      .populate('files')
      .populate('type')
      .populate('unitType')
      .populate('typeAgreement')
  }

  public static isCompleteSingers(activity) {
    const signers = activity.signers.filter((item) => !item.signed)

    if (signers.length > 0) {
      return false
    }

    return true
  }

  public static isCompleteSignersAchievements(activity) {
    for (const achievement of activity.achievements) {
      if (!this.isCompleteSignsUsers(achievement)) {
        return false
      }
    }

    return true
  }

  public static isCompletePercentAchievement(activity) {
    let total = 0
    for (const achievement of activity.achievements) {
      total += achievement.percent
    }
    return total >= 100
  }

  public static async addAchievement(activity, achievement) {
    activity.achievements.push(achievement._id)

    return activity.save()
  }

  private static existStatus(activity) {
    return activity.status
  }

  private static createStatus(status) {
    return statusActivities(status)
  }

  private static createNameActivity(typeActivity) {
    return `${typeActivity.name.es}`
  }

  public static getSigners(signers: Array<any>, activity) {
    for (const signer of signers) {
      if (
        activity.signers.filter(
          (item) => item.userId.toString() === signer.userId
        ).length === 0
      ) {
        activity.signers.push(signer)
      }
    }

    return activity.signers
  }

  public static groupSurfaceAndDateAchievements(activities, type) {
    return activities
      .map((activity) => {
        if (
          this.isActivityType(activity, type) &&
          type !== 'ACT_MONITORING' &&
          type !== 'ACT_HARVEST'
        ) {
          const total = this.sumSurfacesByLotsAchievements(
            activity.achievements
          )

          return {
            total: total,
            date: activity.achievements[0].dateAchievement?.toLocaleDateString(
              'en-US',
              {
                year: 'numeric',
                month: '2-digit'
              }
            )
          }
        }

        if (this.isActivityType(activity, type) && type === 'ACT_MONITORING') {
          let total = 0

          total += activity.lots.reduce((a, b) => a + (b['surface'] || 0), 0)

          return {
            total: total,
            date: activity.dateObservation?.toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit'
            })
          }
        }

        if (this.isActivityType(activity, type) && type === 'ACT_HARVEST') {
          if (!activity?.dateHarvest) return undefined

          let total = 0

          total += activity.lots.reduce((a, b) => a + (b['surface'] || 0), 0)

          return {
            total: total,
            date: activity?.dateHarvest?.toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit'
            })
          }
        }
        return undefined
      })
      .filter((activity) => activity)
  }

  private static sumSurfacesByLotsAchievements(achievements) {
    let total = 0

    for (const achievement of achievements) {
      total += achievement.lots.reduce((a, b) => a + (b['surface'] || 0), 0)
    }

    return total
  }

  private static isActivityType(activity, type: string): boolean {
    if (activity.type.tag === type) {
      return true
    }

    return false
  }

  /* Add services integration.
   *
   * @param id
   * @param service
   */
  public static async changeStatusSynchronized(
    id: string,
    service: string
  ): Promise<void> {
    await Activity.findByIdAndUpdate(id, {
      synchronizedList: [{ service, isSynchronized: true }]
    })
  }
}

export default ActivityService
