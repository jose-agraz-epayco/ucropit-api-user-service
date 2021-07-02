import { Request, Response } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { errors } from '../types/common'

import {
  validateAchievement,
  validateSignAchievement,
  validateFilesWithEvidences,
  validateExtensionFile,
  calculateCropEiq,
  calculateEIQSurfaceAchievement,
  calculateActivityEiq,
  getEiqRange,
  getEiqOfAchievementsByLot
} from '../utils'

import AchievementService from '../services/AchievementService'
import ActivityService from '../services/ActivityService'
import CropService from '../services/CropService'
import BlockChainServices from '../services/BlockChainService'
import ApprovalRegisterSingService from '../services/ApprovalRegisterSignService'
import UserConfigService from '../services/UserConfigService'
import IntegrationService from '../services/IntegrationService'

import models from '../models'
import NotificationService from '../services/NotificationService'
import { emailTemplates } from '../types/common'
import { typesSupplies } from '../utils/Constants'
import agenda from '../jobs'
import { AchievementRepository, ActivityRepository, CropRepository, EiqRangesRepository, envImpactIndiceRepository, LotRepository } from '../repositories'
import { IEntity, IEiqRangesDocument, IEnvImpactIndice, IEnvImpactIndiceDocument } from '../interfaces'

const Crop = models.Crop

class AchievementsController {
  /**
   * Get all achievements filter query.
   *
   * @param Request req
   * @param Response res
   *
   * @return Response
   */
  public async index(req: Request, res: Response) {
    const { activityId } = req.query

    if (activityId) {
      const activity = await ActivityService.findActivityById(
        String(activityId)
      )

      return res.status(200).json(activity.achievements)
    }

    const achievements = await AchievementService.find({})

    res.status(200).json(achievements)
  }

  /**
   * Get One Achievement.
   *
   * @param Request req
   * @param Response res
   *
   * @returns Response
   */
  public async show(req: Request, res: Response) {
    const { id } = req.params

    const achievement = await AchievementService.findById(id)

    res.status(200).json(achievement)
  }

  /**
   * Create a new Achievement.
   *
   * @param Request req
   * @param Response res
   *
   * @return Response
   */
  public async create(req: Request, res: Response) {
    const user: any = req.user
    const data = JSON.parse(req.body.data)
    const crop: any = await Crop.findById(data.crop)
    const userConfig = await UserConfigService.findById(user.config)

    await validateAchievement(data)

    const validationExtensionFile = validateExtensionFile(req.files)

    if (validationExtensionFile.error) {
      return res.status(400).json(validationExtensionFile.code)
    }

    const validationFiles = validateFilesWithEvidences(
      req.files,
      data.evidences
    )

    if (validationFiles.error) {
      return res.status(400).json(validationFiles)
    }

    const activity: any = await ActivityService.findActivityById(data.activity)

    let achievement: any = await AchievementService.store(data, activity)
    try {
      const envImpactIndiceIds: IEnvImpactIndiceDocument[] = await this.setEiqInEnvImpactIndice(data,achievement)
      await this.setEnvImpactIndicesInEntities(envImpactIndiceIds)
    } catch (error) {
      console.log(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: ReasonPhrases.INTERNAL_SERVER_ERROR,
        description: errors.find((error) => error.key === '007').code
      })
    }


    await ActivityService.addAchievement(activity, achievement)

    if (activity.status[0].name.en !== 'DONE') {
      await ActivityService.changeStatus(activity, 'DONE')
      await CropService.removeActivities(activity, crop, 'toMake')
      await CropService.addActivities(activity, crop)
    }

    if (req.files) {
      achievement = await AchievementService.addFiles(
        achievement,
        data.evidences,
        req.files,
        user,
        `achievements/${achievement.key}`
      )
    }

    const signers = achievement.signers.filter((el) => {
      return !el.signed && user.email !== el.email
    })

    const type = typesSupplies.find((el) => activity.type.tag === el.tag).value
    const url = `${process.env.BASE_URL}/${process.env.FAST_LINK_URL}?url=activities/${crop._id}/${type}/common/detail/${achievement._id}/${activity._id}/true?tag=${activity.type.tag}`

    for (let signer of signers) {
      await NotificationService.email(
        emailTemplates.NOTIFICATION_ACTIVITY,
        signer,
        {
          name: signer.fullName,
          cropName: crop.name,
          url,
          activity: activity.type.name.es
        },
        {
          title: 'Recordatorio para firmar',
          content: 'Tenes realizaciones sin firmar'
        }
      )
    }

    const agendaData = {
      url,
      cropName: crop.name,
      achievement: achievement._id,
      activityLabel: activity.type.name.es,
      activity: activity._id
    }

    await agenda.cancel({ data: agendaData })
    const reminder = agenda.create('reminder-activity-email', {
      cropName: crop.name,
      achievement: achievement._id,
      activityLabel: activity.type.name.es,
      activity: activity._id
    })

    await reminder.repeatEvery('2 day', {
      skipImmediate: true,
      timezone: 'America/Argentina/Buenos_Aires'
    })

    await reminder.save()

    try {
      await IntegrationService.exportAchievement(
        {
          cropId: data.crop,
          activityId: data.activity,
          achievementId: achievement._id,
          erpAgent: 'auravant',
          identifier: userConfig.companySelected.identifier
        },
        req
      )
    } catch (error) {
      console.log(error)
    }

    res.status(201).json(achievement)
  }

  /**
   * set Eiq.
   *
   * @param string cropId
   * @param string activityId
   * @param object achievement
   *
   */
     private async setEiqInEnvImpactIndice({crop,activity,lots},achievement): Promise<IEnvImpactIndiceDocument[]> {
      const { _id } = achievement || {}
      let entryEnvImpactIndice = {
        crop,
        activity,
        achievement:_id
      }
        const eiqRanges: IEiqRangesDocument[] = await EiqRangesRepository.getAllEiq()
        const { activities } = await CropRepository.getCropWithActivities(crop)
        let envImpactIndices: IEnvImpactIndice[] = lots.map((id): IEnvImpactIndice =>{
          const { eiq } = getEiqOfAchievementsByLot(id,activities)
          return {
            ...entryEnvImpactIndice,
            lot:id,
            entity: IEntity.LOT,
            eiq:{
              value: eiq,
              range: getEiqRange(eiq, eiqRanges)
            }
          }
        })
        const activityObj = activities.find(({_id}) =>_id.toString() === activity.toString())
        const cropEiq: number = calculateCropEiq(activities)
        envImpactIndices.push({
          ...entryEnvImpactIndice,
          entity: IEntity.CROP,
          eiq:{
            value: cropEiq,
            range: getEiqRange(cropEiq, eiqRanges)
          }
        })
        const activityEiq: number = calculateActivityEiq(activityObj)
        envImpactIndices.push({
          ...entryEnvImpactIndice,
          entity: IEntity.ACTIVITY,
          eiq:{
            value: activityEiq,
            range: getEiqRange(activityEiq, eiqRanges)
          }
        })
        const achievementEiq: number = calculateEIQSurfaceAchievement(achievement)
        envImpactIndices.push({
          ...entryEnvImpactIndice,
          entity: IEntity.ACHIEVEMENT,
          eiq:{
            value: achievementEiq,
            range: getEiqRange(achievementEiq, eiqRanges)
          }
        })
        return envImpactIndiceRepository.createAllEnvImpactIndice(envImpactIndices)
    }

    private async setEnvImpactIndicesInEntities(envImpactIndiceIds): Promise<void> {
      const envImpactIndices: IEnvImpactIndiceDocument[] = await envImpactIndiceRepository.getEnvImpactIndicesByIds(envImpactIndiceIds)
      Promise.all(envImpactIndices.map(async ({entity, _id, crop, lot, activity, achievement }) =>{
        if (entity === IEntity.CROP) {
          await CropRepository.updateOneCrop({_id: crop},{envImpactIndice:_id})
        }
        if (entity === IEntity.LOT) {
          await LotRepository.updateOneLot({_id: lot},{envImpactIndice:_id})
        }
        if (entity === IEntity.ACTIVITY) {
          await ActivityRepository.updateOneActivity({_id: activity},{envImpactIndice:_id})
        }
        if (entity === IEntity.ACHIEVEMENT) {
          await AchievementRepository.updateOneAchievement({_id: achievement},{envImpactIndice:_id})
        }
      }))
    }
  /**
   * User Sign to Achievement.
   *
   * @param Request req
   * @param Response res
   *
   * @return Response
   */
  public async signAchievement(req: Request, res: Response) {
    req.setTimeout(0)
    const user = req.user
    const { id } = req.params

    await validateSignAchievement(req.body)

    const { activityId, cropId } = req.body

    let achievement = await AchievementService.findById(id)
    let activity = await ActivityService.findActivityById(activityId)
    const crop = await Crop.findById(cropId).populate('cropType')

    await ActivityService.signUser(activity, user)

    await AchievementService.signUser(achievement, user)

    achievement = await AchievementService.findById(id)

    activity = await ActivityService.findActivityById(activityId)

    const isCompleteSigned =
      ActivityService.isCompleteSignersAchievements(activity)
    const isCompletePercent =
      ActivityService.isCompletePercentAchievement(activity)

    if (isCompleteSigned && isCompletePercent) {
      const { ots, hash, pathPdf, nameFilePdf, nameFileOts, pathOtsFile } =
        await BlockChainServices.sign(crop, activity)

      const approvalRegisterSign = await ApprovalRegisterSingService.create({
        ots,
        hash,
        pathPdf,
        nameFilePdf,
        nameFileOts,
        pathOtsFile,
        activity
      })

      activity.approvalRegister = approvalRegisterSign._id

      await ActivityService.changeStatus(activity, 'FINISHED')
      await CropService.removeActivities(activity, crop, 'done')
      await CropService.addActivities(activity, crop)
    }

    res.status(200).json(achievement)
  }

  /**
   * Download PDF to progress Activity.
   *
   * @param Request req
   * @param Response res
   */
  public async makePdf(req: Request, res: Response) {
    const { idActivity, idCrop } = req.params

    const activity = await ActivityService.findActivityById(idActivity)
    const crop = await Crop.findById(idCrop).populate('cropType')

    const pdf = await AchievementService.generatePdf(activity, crop)

    return res.status(200).json(pdf.publicPath)
  }
}

export default new AchievementsController()
