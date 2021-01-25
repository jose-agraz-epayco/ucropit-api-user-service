import { Request, Response } from 'express'
import models from '../models'

const CropType = models.CropType
const UnitType = models.UnitType
const ActivityType = models.ActivityType
const TypeAgreement = models.TypeAgreement
const EvidenceConcepts = models.EvidenceConcept

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
    const cropTypes = await CropType.find({})

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
    const unitTypes = await UnitType.find({})

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
    const activitiesTypes = await ActivityType.find({})

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
    const evidenceConcepts = await EvidenceConcepts.find({})

    res.status(200).json(evidenceConcepts)
  }
}

export default new CommonController()
