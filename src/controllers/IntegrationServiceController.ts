import { Request, Response } from 'express'
import IntegrationService from '../services/IntegrationService'
import CropService from '../services/CropService'
import CompanyService from '../services/CompanyService'
import AchievementService from '../services/AchievementService'
import UserConfigService from '../services/UserConfigService'
import { ResponseIntegration } from '../interfaces/integrations'

class IntegrationServiceController {
  /**
   * Get crop Data.
   * @param Request req
   * @param Response res
   *
   * @return {Response}
   */
  public async cropData(req: Request | any, res: Response) {
    const { ids } = req.query

    const crops = await CropService.getCropsByIds(ids)

    res.status(200).json(crops)
  }

  /**
   * Get Detail Log Exporters.
   *
   * @param Request req
   * @param Response res
   *
   * @return {Response}
   */
  public async detailExport(req: Request, res: Response) {
    const { cropId, service } = req.params

    const logs = await IntegrationService.getLogIntegration(cropId, service)

    res.status(200).json(logs)
  }

  /**
   * Get Account Integration Service
   *
   * @param Request req
   * @param Response res
   *
   * @return {Response}
   */
  public async accountService(req: Request, res: Response) {
    const { identifier, service } = req.params
    const {
      data: { user, password }
    } = await IntegrationService.findAccount(
      `${process.env.ADAPTER_URL}/${process.env.ENDPOINT_INTEGRATION_USER}/${service}/${identifier}`
    )

    res.status(200).json({ user, password })
  }

  /**
   * Added service integration.
   *
   * @param Request req
   * @param Response res
   *
   * @return {Response}
   */
  public async create(req: Request, res: Response) {
    const data = req.body

    await IntegrationService.create(
      data,
      `${process.env.ADAPTER_URL}/${process.env.ENDPOINT_INTEGRATION_USER}`
    )

    const addedServices = await CompanyService.addServiceIntegration(
      data.erpAgent,
      data.ucropitCompanyId
    )

    if (addedServices.error) {
      return res.status(400).json('ERROR_SERVICES_INTEGRATED')
    }
    res.status(200).json('Ok')
  }

  /**
   * Update Credentials Account Service Integration
   *
   * @param Request req
   * @param Response res
   *
   * @return {Response}
   */
  public async update(req: Request, res: Response) {
    const data = req.body

    const response = await IntegrationService.update(
      {
        user: data.user,
        password: data.password
      },
      `${process.env.ADAPTER_URL}/${process.env.ENDPOINT_INTEGRATION_USER}/${data.erpAgent}/${data.identifier}`
    )

    if (response.error) {
      return res.status(400).json('ERROR_SERVICES_UPDATE')
    }

    res.status(200).json('Ok')
  }

  /**
   * Unlink service integration.
   *
   * @param Request req
   * @param Response res
   *
   * @return {Response}
   */
  public async unlink(req: Request, res: Response) {
    const { id, service, identifier } = req.params

    await IntegrationService.delete(
      `${process.env.ADAPTER_URL}/${process.env.ENDPOINT_INTEGRATION_USER}/${service}/${identifier}`
    )

    await CompanyService.removeServiceIntegration(service, id)

    res.status(200).json('Ok')
  }

  /**
   * Export data crop to third party service.
   *
   * @param Request req
   * @param Response res
   *
   * @return {Response}
   */
  public async exporterCrops(req: Request, res: Response) {
    const token: string = req.get('authorization').split(' ')[1]
    const user: any = req.user
    const data = req.body
    let responseIntegration: ResponseIntegration = {}

    const userConfig: any = await UserConfigService.findById(user.config)

    await CropService.addServiceSynchronized(data)

    try {
      const [item] = await IntegrationService.export(
        {
          ...data,
          token: token,
          identifier: userConfig.companySelected.identifier
        },
        `${process.env.ADAPTER_URL}/${process.env.ENDPOINT_EXPORTER_CROPS}`
      )
      responseIntegration = item
    } catch (error) {
      console.log('ERROR AL SINCRONIZAR CON EL SERVICIO DE TERCERO')
      console.log(error)
    }

    await CropService.changeStatusSynchronized(responseIntegration)

    const log = await IntegrationService.createLog(
      responseIntegration,
      responseIntegration.cropId
    )

    res.status(200).json({ status: 'Ok', log })
  }

  /**
   * Export data achievement to third party service.
   *
   * @param Request req
   * @param Response res
   *
   * @return {Response}
   */
  public async exporterAchievements(req: Request, res: Response) {
    const { cropId, activityId, achievementId } = req.params
    const user: any = req.user
    const data: any = req.body

    const crop: any = await CropService.findOneCrop(cropId)

    if (CropService.serviceCropIsSynchronized(crop, data.erpAgent)) {
      const token: string = req.get('authorization').split(' ')[1]
      const userConfig: any = await UserConfigService.findById(user.config)

      const response = await IntegrationService.export(
        {
          token: token,
          erpAgent: data.erpAgent,
          identifier: userConfig.companySelected.identifier,
          achievementId: achievementId,
          activityId: activityId
        },
        `${process.env.ADAPTER_URL}/${process.env.ENDPOINT_EXPORTER_ACHIEVEMENTS}`
      )

      await AchievementService.changeStatusSynchronized(
        response.achievementId,
        response.erpAgent
      )

      return res.status(200).json(response)
    }

    return res.status(200).json(req.__('achievements.not_async'))
  }
  /**
   * query crop achievements
   *
   * @param Request req
   * @param Response res
   *
   * @return {Response}
   */
  public async getCropSyncAchievements(req: Request, res: Response) {
    const { ids } = req.query
    await CropService.findOneCrop(ids.toString())
    const achievement = await AchievementService.find(ids)

    res.status(200).json(achievement)
  }
}

export default new IntegrationServiceController()
