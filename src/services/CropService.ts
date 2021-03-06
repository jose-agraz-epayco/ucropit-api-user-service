import models from '../models'
import { isNowGreaterThan } from '../utils/Date'
import ServiceBase from './common/ServiceBase'
import ActivityService from './ActivityService'

const Crop = models.Crop
const Activity = models.Activity
const ActivityType = models.ActivityType

interface ICrop {
  name: string
  pay: number
  surface: number
  dateCrop: string
  dateHarvest: string
  cropType: Object
  unitType: Object
  lots: Array<any>
  members: Array<any>
  company: string
}

const statusActivities: Array<any> = [
  {
    name: 'TO_COMPLETE',
    cropStatus: 'pending'
  },
  {
    name: 'PLANNED',
    cropStatus: 'toMake'
  },
  {
    name: 'DONE',
    cropStatus: 'done'
  },
  {
    name: 'FINISHED',
    cropStatus: 'finished'
  },
  {
    name: 'EXPIRED',
    cropStatus: 'toMake'
  }
]

class CropService extends ServiceBase {
  public static createDataCropToChartSurface(crops) {
    const listSurfacesData = crops.map((crop) => {
      const sumSurfaceExplo: any = this.sumSurfacesAndDateActivitiesAgreement(
        crop.finished,
        'ACT_AGREEMENTS',
        'EXPLO',
        crop
      )
      const sumSurfaceSustain: any = this.sumSurfacesAndDateActivitiesAgreement(
        crop.finished,
        'ACT_AGREEMENTS',
        'SUSTAIN',
        crop
      )

      if (sumSurfaceExplo.total === sumSurfaceSustain.total) {
        return {
          total: sumSurfaceExplo.total,
          date: sumSurfaceExplo.date
        }
      }

      if (sumSurfaceExplo.total > sumSurfaceSustain.total) {
        return {
          total: sumSurfaceSustain.total,
          date: sumSurfaceSustain.date
        }
      }

      if (sumSurfaceExplo.total < sumSurfaceSustain.total) {
        return {
          total: sumSurfaceExplo.total,
          date: sumSurfaceExplo.date
        }
      }
    })

    return this.summaryData(listSurfacesData)
  }

  public static getSummaryVolumes(crops) {
    const listVolumes = crops.map((crop) => {
      return {
        total: this.calVolume(crop.unitType.key, crop.pay, crop.surface),
        date: crop.dateHarvest.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit'
        })
      }
    })

    return this.summaryData(listVolumes)
  }

  public static summaryData(list) {
    let total = 0
    let date = ''
    const summary = []
    for (const data of list) {
      if (date !== data.date) {
        total += data.total
        date = data.date
        summary.push({
          total,
          date
        })
      } else {
        const index = summary.findIndex((item) => item.date === date)
        summary[index].total += data.total
      }
      total = 0
    }

    return summary
  }

  public static sumSurfacesActivityAgreement(activities, type, typeAgreement?) {
    const filterActivity = activities.filter((activity) => {
      return (
        activity.type.tag === type &&
        typeAgreement &&
        activity.typeAgreement &&
        activity.typeAgreement.key === typeAgreement
      )
    })

    let total = 0
    for (const activity of filterActivity) {
      total += activity.lots.reduce((a, b) => a + (b['surface'] || 0), 0)
    }

    return total
  }

  public static sumSurfacesByLot(crop) {
    const totalPerLot = crop.lots.map((lot) => {
      return this.sumSurfacesLot(lot)
    })

    return totalPerLot.reduce((a, b) => a + b, 0)
  }

  public static sumSurfacesLot(lot) {
    return lot.data.reduce((a, b) => a + (b['surface'] || 0), 0)
  }

  public static sumSurfacesAndDateActivitiesAgreement(
    activities,
    type,
    typeAgreement,
    crop
  ) {
    const filterActivity = activities.filter((activity) => {
      return (
        activity.type.tag === type &&
        typeAgreement &&
        activity.typeAgreement &&
        activity.typeAgreement.key === typeAgreement
      )
    })
    let total = 0
    let date = new Date()
    for (const activity of filterActivity) {
      total += activity.lots.reduce((a, b) => a + (b['surface'] || 0), 0)

      date = crop.dateCrop.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit'
      })
    }

    return { total, date }
  }

  /**
   *
   * @param unit
   * @param pay
   * @param surfaces
   */
  public static calVolume(unit: string, pay: number, surfaces: number): number {
    if (unit === 'kg') {
      return (pay / 1000) * surfaces
    }

    if (unit === 't') {
      return pay * surfaces
    }

    if (unit === 'q') {
      return (pay / 10) * surfaces
    }

    return 0
  }

  /**
   * Get all crops.
   *
   * @param query
   */
  public static async getAll(query?) {
    let crops = await this.findAll(query)

    crops = crops.map(async (crop) => {
      crop = await this.expiredActivities(crop)

      crop = await this.changeStatusActivitiesRange(crop)

      return crop
    })

    return Promise.all(crops)
  }

  public static async cropsOnlySeeRoles(query: any) {
    const crops = await this.findAll(query)

    return crops
  }

  public static async cropsOnlySeeRolesSowing(query: any) {
    const crops = await this.findAllSowing(query)
    return crops
  }

  /**
   * Find All crops by query filter.
   *
   * @param query
   */
  public static async findAllSowing(query) {
    return Crop.find(query)
      .populate('lots.data')
      .populate('cropType')
      .populate('unitType')
      .populate({
        path: 'company',
        populate: [
          { path: 'files' },
          { path: 'contacts.user' },
          { path: 'country' }
        ]
      })
      .populate({
        path: 'done',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots' },
          { path: 'files' },
          {
            path: 'achievements',
            populate: [{ path: 'lots' }, { path: 'files' }]
          },
          { path: 'lotsMade' },
          { path: 'user' }
        ]
      })
      .populate('members.user')
      .populate({
        path: 'finished',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots' },
          { path: 'files' },
          { path: 'user' },
          {
            path: 'approvalRegister',
            populate: [
              { path: 'filePdf' },
              { path: 'fileOts' },
              { path: 'activity' }
            ]
          },
          {
            path: 'achievements',
            populate: [{ path: 'lots' }, { path: 'files' }]
          }
        ]
      })
  }

  /**
   * Find All crops by query filter.
   *
   * @param query
   */
  public static async findAll(query): Promise<any> {
    return Crop.find(query)
      .populate('lots.data')
      .populate('cropType')
      .populate('unitType')
      .populate({
        path: 'company',
        populate: [
          { path: 'files' },
          { path: 'contacts.user' },
          { path: 'country' }
        ]
      })
      .populate({
        path: 'pending',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots' },
          { path: 'files' },
          { path: 'user' },
          { path: 'unitType' }
        ]
      })
      .populate({
        path: 'toMake',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots' },
          { path: 'files' },
          { path: 'user' },
          { path: 'unitType' }
        ]
      })
      .populate({
        path: 'done',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots' },
          { path: 'files' },
          {
            path: 'achievements',
            populate: [
              { path: 'lots' },
              { path: 'files' },
              { path: 'supplies', populate: [{ path: 'typeId' }] }
            ]
          },
          { path: 'lotsMade' },
          { path: 'user' },
          { path: 'unitType' }
        ]
      })
      .populate('members.user')
      .populate({
        path: 'finished',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots' },
          { path: 'files' },
          { path: 'user' },
          { path: 'unitType' },
          {
            path: 'approvalRegister',
            populate: [
              { path: 'filePdf' },
              { path: 'fileOts' },
              { path: 'activity' }
            ]
          },
          {
            path: 'achievements',
            populate: [
              { path: 'lots' },
              { path: 'files' },
              { path: 'supplies', populate: [{ path: 'typeId' }] }
            ]
          }
        ]
      })
  }

  public static async getCropsByIds(ids: Array<string>) {
    return Crop.find()
      .populate('lots.data')
      .populate('cropType')
      .populate('unitType')
      .populate({
        path: 'company',
        populate: [
          { path: 'files' },
          { path: 'contacts.user' },
          { path: 'country' }
        ]
      })
      .populate({
        path: 'done',
        populate: [
          { path: 'type' },
          { path: 'supplies.typeId' },
          { path: 'lots' },
          {
            path: 'achievements',
            populate: [{ path: 'lots' }, { path: 'supplies.typeId' }]
          }
        ]
      })
      .populate('members.user')
      .populate({
        path: 'finished',
        populate: [
          { path: 'type' },
          { path: 'lots' },
          { path: 'supplies.typeId' },
          {
            path: 'achievements',
            populate: [{ path: 'lots' }, { path: 'supplies.typeId' }]
          }
        ]
      })
      .where('_id')
      .in(ids)
      .lean()
  }

  /**
   *  Get One crop and json converter.
   *
   * @param string id
   */
  public static async getCrop(id: string): Promise<any> {
    return Crop.findById(id)
      .populate('lots.data')
      .populate('cropType')
      .populate('unitType')
      .populate({
        path: 'company',
        populate: [
          { path: 'files' },
          { path: 'contacts.user' },
          { path: 'country' }
        ]
      })

      .populate({
        path: 'pending',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots', select: '-area -__v -geometryData' },
          { path: 'files' }
        ]
      })
      .populate({
        path: 'toMake',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots', select: '-area -__v -geometryData' },
          { path: 'files' },
          {
            path: 'supplies',
            populate: [{ path: 'typeId' }, { path: 'supply' }]
          }
        ]
      })
      .populate({
        path: 'done',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots', select: '-area -__v -geometryData' },
          { path: 'files' },
          {
            path: 'achievements',
            populate: [
              { path: 'lots' },
              { path: 'files' },
              {
                path: 'supplies',
                populate: [{ path: 'typeId' }, { path: 'supply' }]
              }
            ]
          },
          { path: 'lotsMade' },
          {
            path: 'supplies',
            populate: [{ path: 'typeId' }, { path: 'supply' }]
          }
        ]
      })
      .populate({
        path: 'finished',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots', select: '-area -__v -geometryData' },
          { path: 'files' },
          {
            path: 'achievements',
            populate: [
              { path: 'lots' },
              { path: 'files' },
              {
                path: 'supplies',
                populate: [{ path: 'typeId' }, { path: 'supply' }]
              }
            ]
          },
          {
            path: 'supplies',
            populate: [{ path: 'typeId' }, { path: 'supply' }]
          }
        ]
      })
      .populate('members.user')
      .populate('badges.badge')
      .populate('badges.typeAgreement')
      .lean({ virtuals: true })
  }

  /**
   *
   * @param cropId
   */
  public static async getCropById(cropId: string) {
    let crop = await this.findOneCrop(cropId)

    crop = await this.expiredActivities(crop)

    crop = await this.changeStatusActivitiesRange(crop)

    return crop
  }

  public static async getLastMonitoring(cropId: string) {
    const crop = await CropService.findOneCrop(cropId)

    const activityName: any = await ActivityType.findOne({
      tag: 'ACT_MONITORING'
    })

    function filterActivity(item) {
      return (
        item.name === activityName.name.es || item.name === activityName.name.en
      )
    }

    const activitiesPending = crop.pending.filter((item) =>
      filterActivity(item)
    )

    const activitiesToMake = crop.toMake.filter((item) => filterActivity(item))

    const activitiesDone = crop.done.filter((item) => filterActivity(item))

    const activitiesFinished = crop.finished.filter((item) =>
      filterActivity(item)
    )

    const activitiesMerged = [
      ...activitiesPending,
      ...activitiesFinished,
      ...activitiesToMake,
      ...activitiesDone
    ]

    const activitiesSorted = activitiesMerged.sort((a, b) => {
      if (a._id.getTimestamp() < b._id.getTimestamp()) {
        return 1
      }
      if (a._id.getTimestamp() > b._id.getTimestamp()) {
        return -1
      }
      return 0
    })
    return activitiesSorted[0]
  }

  /**
   * Find One Crop by Id.
   *
   * @param cropId
   */
  public static async findOneCrop(cropId: string): Promise<any> {
    return Crop.findById(cropId)
      .populate('lots.data')
      .populate('cropType')
      .populate('unitType')
      .populate({
        path: 'company',
        populate: [
          { path: 'files' },
          { path: 'contacts.user' },
          { path: 'country' }
        ]
      })
      .populate({
        path: 'pending',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots' },
          { path: 'files' },
          {
            path: 'approvalRegister',
            populate: [{ path: 'file' }, { path: 'activity' }]
          }
        ]
      })
      .populate({
        path: 'toMake',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots' },
          { path: 'files' },
          {
            path: 'approvalRegister',
            populate: [{ path: 'file' }, { path: 'activity' }]
          }
        ]
      })
      .populate({
        path: 'done',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots' },
          { path: 'files' },
          {
            path: 'approvalRegister',
            populate: [{ path: 'file' }, { path: 'activity' }]
          },
          {
            path: 'achievements',
            populate: [{ path: 'lots' }, { path: 'files' }]
          },
          { path: 'lotsMade' }
        ]
      })
      .populate({
        path: 'finished',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots' },
          { path: 'files' },
          {
            path: 'approvalRegister',
            populate: [{ path: 'file' }, { path: 'activity' }]
          },
          {
            path: 'achievements',
            populate: [{ path: 'lots' }, { path: 'files' }]
          }
        ]
      })
      .populate('members.user')
  }

  /**
   * Expired Activity.
   *
   * @param crop
   */
  public static async expiredActivities(crop: any) {
    const activitiesToMake = await this.checkListActivitiesExpired(
      crop,
      'toMake'
    )

    crop.toMake = await Promise.all(activitiesToMake)

    return crop
  }

  public static filterCropByIdentifier(identifier: string | any, crops) {
    return crops
      .map((crop) => {
        if (
          crop.members.filter((member) => member.identifier === identifier)
            .length > 0
        ) {
          return crop
        }
        return undefined
      })
      .filter((crop) => crop)
  }

  /**
   * Change status in list activities range.
   *
   * @param crop
   *
   * @return Promise
   */
  public static async changeStatusActivitiesRange(crop: any): Promise<any> {
    const listActivitiesExpired = (
      await this.listActivitiesExpiredRange(crop, 'done')
    ).filter((activity) => activity)
    const listActivitiesFinished = (
      await this.listActivitiesFinishedRange(crop, 'done')
    ).filter((activity) => activity)

    if (listActivitiesExpired.length > 0) {
      for (let activity of listActivitiesExpired) {
        await this.removeActivities(activity, crop, 'done')
        activity = await ActivityService.changeStatus(activity, 'TO_COMPLETE')
        await this.addActivities(activity, crop)
      }
    }
    if (listActivitiesFinished.length > 0) {
      for (let activity of listActivitiesFinished) {
        await this.removeActivities(activity, crop, 'done')
        activity = await ActivityService.changeStatus(activity, 'FINISHED')
        await this.addActivities(activity, crop)
      }
    }

    return this.findOneCrop(crop._id)
  }

  public static async handleDataCrop(
    data,
    company,
    lotsData,
    activities,
    { members }
  ) {
    const lotsArray = []
    let tagIndex = null

    for (const item of lotsData) {
      for (const lot of item.lots) {
        if (tagIndex !== item.tag) {
          lotsArray.push({
            tag: item.tag,
            data: [lot._id]
          })
          tagIndex = item.tag
        } else {
          const index = lotsArray.findIndex((x) => x.tag === item.tag)
          lotsArray[index].data.push(lot._id)
        }
      }
    }

    data.lots = lotsArray
    data.company = company ? company._id : null
    data.pending = activities

    const newCrop: any = await this.store(data)

    newCrop.members.push({
      user: members._id,
      producer: true,
      identifier: data.identifier,
      country: company ? company.country : null
    })

    await newCrop.save()

    return newCrop
  }

  public static async store(crop: ICrop) {
    const newCrop = new Crop(crop)
    return newCrop.save()
  }

  public static async removeActivities(activity, crop, statusCrop = 'pending') {
    crop[statusCrop].pull(activity._id)

    return crop.save()
  }

  public static async addActivities(activity, crop) {
    const status = statusActivities.find(
      (item) => item.name === activity.status[0].name.en
    )

    const statusCrop = status.cropStatus
    if (!this.isExistActivity(activity, crop, statusCrop)) {
      crop[statusCrop].push(activity._id)
    }

    return crop.save()
  }

  public static isExistActivity(activity, crop, status: string): boolean {
    if (
      crop[status].find(
        (item) => item._id.toString() === activity._id.toString()
      )
    ) {
      return true
    }

    return false
  }

  public static async cancelled(cropId) {
    const crop: any = await Crop.findById(cropId)

    if (
      crop.toMake.length === 0 &&
      crop.done.length === 0 &&
      crop.finished.length === 0
    ) {
      crop.cancelled = true

      await crop.save()

      return true
    }

    return false
  }

  /**
   * Change status synchronized data crop.
   *
   * @param result
   */
  public static async changeStatusSynchronized(result): Promise<void> {
    await Crop.updateOne(
      { _id: result.cropId, 'synchronizedList.service': result.erpAgent },
      { $set: { 'synchronizedList.$.isSynchronized': true } }
    )
  }

  public static async addServiceSynchronized(data): Promise<boolean> {
    for (const item of data.crops) {
      const crop: any = await Crop.findById(item.id)
      if (!this.isServiceAdded(crop, item.erpAgent)) {
        if (!crop.synchronizedList) {
          const synchronized = []
          synchronized.push({ service: data.erpAgent })
          crop.synchronizedList = synchronized
        } else {
          if (
            crop.synchronizedList.filter((el) => el.service === data.erpAgent)
              .length === 0
          ) {
            crop.synchronizedList.push({ service: data.erpAgent })
          }
        }

        await crop.save()
      }
    }

    return true
  }

  public static serviceCropIsSynchronized(crop: any, service: any): boolean {
    return (
      service &&
      crop?.synchronizedList.filter((item) => item.service === service).length >
        0 &&
      crop?.synchronizedList.find((item) => item.service === service)
        .isSynchronized
    )
  }

  private static isServiceAdded(crop: any, service: string) {
    return (
      crop?.synchronizedList &&
      crop?.synchronizedList.filter((item) => item.service === service).length >
        0
    )
  }

  /**
   *
   * @param crop
   * @param statusCrop
   */
  private static async listActivitiesExpiredRange(crop, statusCrop: string) {
    const activities = crop[statusCrop].map(async (activity: any) => {
      if (
        this.isExpiredActivity(activity, statusCrop) &&
        !this.isTotalPercentAchievements(activity)
      ) {
        return activity
      }

      return undefined
    })

    return Promise.all(activities)
  }

  /**
   *
   * @param crop
   * @param statusCrop
   */
  private static async listActivitiesFinishedRange(crop, statusCrop: string) {
    const activities = crop[statusCrop].map(async (activity: any) => {
      if (
        !this.isExpiredActivity(activity, statusCrop) &&
        this.isTotalPercentAchievements(activity) &&
        this.checkCompleteSignedEachAchievements(activity)
      ) {
        return activity
      }

      return undefined
    })

    return Promise.all(activities)
  }

  /**
   *
   * @param activity
   */
  private static checkCompleteSignedEachAchievements(activity: any): boolean {
    let completeSigned = true
    for (const achievement of activity.achievements) {
      if (!this.isCompleteSignsUsers(achievement)) {
        completeSigned = false
        return completeSigned
      }
    }

    return completeSigned
  }

  /**
   *
   * @param crop
   * @param statusCrop
   */
  private static async checkListActivitiesExpired(crop, statusCrop: string) {
    return crop[statusCrop].map(async (activity: any) => {
      if (this.isExpiredActivity(activity)) {
        activity.status[0].name.en = 'EXPIRED'
        activity.status[0].name.es = 'VENCIDA'

        await this.expiredActivity(activity)

        return activity
      }

      return activity
    })
  }

  /**
   *
   * @param activity
   */
  private static isExpiredActivity(activity, status?): boolean {
    if (
      (activity.dateLimitValidation &&
        isNowGreaterThan(activity.dateLimitValidation) &&
        !status) ||
      (activity.dateEnd && isNowGreaterThan(activity.dateEnd && status))
    ) {
      return true
    }

    return false
  }

  /**
   *  Check is make total percent in achievements activities.
   *
   * @param activity
   *
   * @return boolean
   */
  private static isTotalPercentAchievements(activity): boolean {
    if (!activity.achievements || activity.achievements.length === 0) {
      return false
    }
    const totalPercent = activity.achievements.reduce(
      (a, b) => a + (b['percent'] || 0),
      0
    )

    if (totalPercent >= 100) {
      return true
    }

    return false
  }

  /**
   *
   * @param activity
   */
  private static async expiredActivity(activity) {
    const activityInstance: any = await Activity.findById(activity._id)

    activityInstance.setExpired()

    return activityInstance.save()
  }
}

export default CropService
