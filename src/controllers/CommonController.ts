import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import models from '../models'
import { ActivityTypeDocument } from '../models/activityType'
import { CountryRepository } from '../repositories'
import { getCropTypesUseCase } from '../core/cropTypes/useCase'
import { getStorageTypesUseCase } from '../core/typeStorages/useCase'
import { getUnitTypesUseCase } from '../core/unitTypes/useCase'
import { CropTypeDocument } from '../models/cropType'
import { TypeStorageDocument } from '../models/typeStorage'
import { UnitTypeDocument } from '../models/unitType'
import { parseLangLocal } from '../utils/Locales'
import { activityTypeRepository } from '../repositories'

const ActivityType = models.ActivityType
const TypeAgreement = models.TypeAgreement
const EvidenceConcepts = models.EvidenceConcept
const Roles = models.Roles
const ServiceIntegrations = models.ServiceIntegration

class CommonController {
  /**
   *
   * Get all crops types.
   *
   * @param  Request req
   * @param  Response res
   *
   * @return Response
   */
  public async cropTypes(req: Request, res: Response) {
    const results = await getCropTypesUseCase.execute({})
    const cropTypesKeys = req.__('crop_types.keys') as unknown as object
    const cropTypes = results.map((cropType: CropTypeDocument) => {
      const altLabel = cropType?.name?.es || cropType.key
      return {
        ...cropType,
        keyLabel: parseLangLocal(cropTypesKeys, cropType.key, altLabel)
      }
    })

    res.status(200).json(cropTypes)
  }

  /**
   * Get all unit types
   *
   * @param req
   * @param res
   *
   *  @return Response
   */
  public async unitTypes(req: Request, res: Response) {
    const results = await getUnitTypesUseCase.execute({})
    const unitTypesKeys = req.__('unit_types.keys') as unknown as object
    const unitTypes = results.map((unitType: UnitTypeDocument) => {
      const altLabel = unitType?.name?.es || unitType.key
      return {
        ...unitType,
        keyLabel: parseLangLocal(unitTypesKeys, unitType.key, altLabel)
      }
    })

    res.status(200).json(unitTypes)
  }

  /**
   *
   * Get all activities types
   *
   * @param req
   * @param res
   *
   * @return Response
   */
  public async activitiesTypes(req: Request, res: Response) {
    const result: ActivityTypeDocument[] = await activityTypeRepository.getAll()
    const activityTypesKeys = req.__('activity_types.tag') as unknown as object

    const activitiesTypes = result.map((activityType: ActivityTypeDocument) => {
      const altLabel = activityType?.name?.es || activityType?.tag
      return {
        ...activityType,
        keyLabel: parseLangLocal(activityTypesKeys, activityType.tag, altLabel)
      }
    })

    res.status(200).json(activitiesTypes)
  }

  /**
   *
   * Get all agreement types
   *
   * @param req
   * @param res
   *
   * @return Response
   */
  public async agreementTypes(req: Request, res: Response) {
    const agreementTypes = await TypeAgreement.find({})

    res.status(200).json(agreementTypes)
  }

  /**
   * Get all evidence concepts.
   *
   * @param Request req
   * @param Response res
   *
   * @return Response
   */
  public async evidenceConcepts(req: Request, res: Response) {
    const evidenceConceptsinstance: any = await EvidenceConcepts.find({})
    const evidenceConcepts = evidenceConceptsinstance.filter(
      (evidence) => evidence.code !== '0009'
    )

    res.status(200).json(evidenceConcepts)
  }

  /**
   * Get all collaborator roletypes
   *
   * @param Request req
   * @param Response res
   *
   * @return Response
   */
  public async roles(req: Request, res: Response) {
    const roles = await Roles.find({})

    res.status(200).json(roles)
  }

  /**
   * Get all services integrations
   *
   * @param Request req
   * @param Response res
   */
  public async serviceIntegration(req: Request, res: Response) {
    const services = await ServiceIntegrations.find({})

    res.status(200).json(services)
  }

  /**
   * Get all storage types
   *
   * @param Request req
   * @param Response res
   */
  public async storageTypes(req: Request, res: Response) {
    const results = await getStorageTypesUseCase.execute({})
    const storageTypeKeys = req.__('type_storages.keys') as unknown as object
    const storageTypes = results.map((storageType: TypeStorageDocument) => {
      const altLabel = storageType?.name?.es || storageType.key
      return {
        ...storageType,
        keyLabel: parseLangLocal(storageTypeKeys, storageType.key, altLabel)
      }
    })

    res.status(200).json(storageTypes)
  }

  /**
   *
   * Get all countries availables.
   *
   * @param Request req
   * @param Response res
   *
   * @return Response
   */
  public async countries(req: Request | any, res: Response) {
    const dataToFind: any = {
      query: {
        disabled: false
      }
    }

    const countries = await CountryRepository.getCountries(dataToFind)

    res.status(StatusCodes.OK).json(countries)
  }
}

export default new CommonController()
