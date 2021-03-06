import models from '../models'

const { Activity } = models

export enum TypeActivity {
  Sowing = 'ACT_SOWING',
  Harvest = 'ACT_HARVEST',
  Application = 'ACT_APPLICATION',
  Monitoring = 'ACT_MONITORING',
  Tillage = 'ACT_TILLAGE',
  Fertilization = 'ACT_FERTILIZATION'
}

export enum NameActivity {
  Sowing = 'Siembra',
  Harvest = 'Cosecha',
  Application = 'Aplicación',
  Monitoring = 'Monitoreo',
  Tillage = 'Labranza',
  Fertilization = 'Fertilización'
}

export class ActivityRepository {
  /**
   *
   * @param string lotId
   *
   * @returns
   */
  public static findActivityByIdWithPopulateAndVirtuals(id: string) {
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
        populate: [{ path: 'lot' }]
      })
      .populate('lotsMade')
      .populate('files')
      .populate({
        path: 'achievements',
        populate: [
          { path: 'lots' },
          {
            path: 'lotsWithSurface',
            populate: [{ path: 'lot' }]
          },
          { path: 'files' },
          {
            path: 'supplies',
            populate: [{ path: 'typeId' }, { path: 'supply' }]
          }
        ]
      })
      .populate('approvalRegister')
      .populate('user')
      .populate({
        path: 'supplies',
        populate: [{ path: 'typeId' }, { path: 'supply' }]
      })
      .populate('subTypeActivity')
      .lean({ virtuals: true })
  }

  /**
   *
   * @param string lotId
   *
   * @returns
   */
  public static findById(lotId: string) {
    return Activity.findById(lotId)
  }

  /**
   * Get all Activities filter by type activity.
   *
   * @param TypeActivity type
   */
  public static async getActivitiesFilterByName(name: NameActivity) {
    const activities = await Activity.find({ name: name })
      .populate('type')
      .populate({
        path: 'achievements',
        populate: [{ path: 'supplies.supply' }]
      })
      .lean({ virtuals: true })

    return !!activities ? activities : null
  }

  /**
   * Find All Activities.
   *
   * @param Generic query
   * @param Generic populate
   *
   * @returns
   */
  public static async findAll<T>(query: T, populate?: T) {
    return Activity.find(query).populate(populate ?? [])
  }

  /**
   * Get Activities.
   *
   * @returns
   */
  public static async getActivities({
    query,
    limit,
    skip,
    sort,
    populate
  }: any): Promise<any> {
    return Activity.find(query ?? {})
      .populate(populate ?? [])
      .limit(limit ?? 0)
      .skip(skip ?? 0)
      .sort(sort ?? {})
  }

  /**
   * Update Activity.
   *
   * @param update
   * @param string id
   */
  static async updateActivity<T>(update: T, id: string) {
    return Activity.updateOne({ _id: id }, { $set: update })
  }
  /**
   *
   * @param query
   * @param dataToUpdate
   *
   * @returns
   */
  public static async updateOneActivity(
    query: any,
    dataToUpdate: any
  ): Promise<any> {
    return Activity.updateOne(query, dataToUpdate)
  }
}
