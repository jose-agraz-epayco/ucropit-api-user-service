import ServiceBase from './common/ServiceBase'
import models from '../models'
import Numbers from '../utils/Numbers'

const Achievement = models.Achievement

interface IAchievement {
  dateAchievement?: String
  surface?: Number
  lots?: Array<string>
  supplies?: Array<any>
  evidences?: Array<any>
  signers?: Array<any>
  percent?: Number
}

class AchievementService extends ServiceBase {

  public static async find (query) {
    return Achievement.find(query).populate('lots').populate('files').populate('signers')
  }

  /**
   *
   * @param string id
   */
  public static async findById (id: string) {
    return Achievement.findById(id).populate('lots').populate('files').populate('signers')
  }

  /**
   *
   * @param IAchievement achievement
   * @param activity
   */
  public static async store (achievement: IAchievement, activity) {
    achievement.percent = this.calcPercent(achievement.lots, activity)
    await this.addLotsAchievement(achievement.lots, activity)

    return Achievement.create(achievement)
  }

  /**
   *
   * @param Array lots
   * @param activity
   */
  public static calcPercent (lots: Array<string> , activity) {
    let lotsSelected: Array<any> = []
    for (const lotId of lots) {
      const lot = activity.lots.filter(lotItem => lotItem._id.toString() === lotId)[0]
      lotsSelected.push(lot)
    }

    const sumPercent = lotsSelected.reduce((a, b) => a + (b['surface'] || 0), 0)

    return Numbers.roundToTwo((sumPercent * 100) / activity.surface)

  }

  /**
   *
   * @param Array lots
   * @param activity
   */
  private static addLotsAchievement (lots: Array<string> , activity) {
    if (activity.lotsMade.length === 0) {
      activity.lotsMade = lots
    } else {
      activity.lotsMade = activity.lotsMade.concat(lots)
    }

    return activity.save()
  }

}

export default AchievementService
