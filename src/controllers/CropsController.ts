import { Request, Response } from 'express'
import models from '../models'
import CropService from '../services/CropService'
import CompanyService from '../services/CompanyService'
import LotService from '../services/LotService'
import UserService from '../services/UserService'
import ActivityService from '../services/ActivityService'

import { validateCropStore } from '../utils/Validation'

import { UserSchema } from '../models/user'

const Crop = models.Crop

class CropsController {
  /**
   *
   * Get all crops.
   *
   * @param  Request req
   * @param  Response res
   *
   * @return Response
   */
  public async index (req: Request, res: Response) {
    const crops = await Crop.find({ cancelled: false })
      .populate('lots')
      .populate('cropType')
      .populate('unitType')
      .populate('company')
      .populate({
        path: 'pending',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots' },
          { path: 'files' }
        ]
      })
      .populate({
        path: 'toMake',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots' },
          { path: 'files' }
        ]
      })
      .populate({
        path: 'done',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots' },
          { path: 'files' }
        ]
      })
      .populate({
        path: 'finished',
        populate: [
          { path: 'collaborators' },
          { path: 'type' },
          { path: 'typeAgreement' },
          { path: 'lots' },
          { path: 'files' }
        ]
      })

    res.status(200).json(crops)
  }

  /**
   * Get one crop.
   *
   * @param  Request req
   * @param  Response res
   *
   * @return Response
   */
  public async show (req: Request, res: Response) {
    const { id } = req.params
    const crop = await CropService.getCropById(id)

    res.status(200).json(crop)
  }

  /**
   * Create a crop
   *
   * @param  Request req
   * @param  Response res
   *
   * @return Response
   */
  public async create (req, res: Response) {
    const user: UserSchema = req.user
    const data = JSON.parse(req.body.data)
    await validateCropStore(data)
    let company = null

    company = (await CompanyService.search({ identifier: data.identifier }))[0]

    if (company) {
      await UserService.update(
        { email: user.email },
        {
          companies: [company._id]
        }
      )
    }

    const lots = await LotService.store(req, {
      names: data.lots.names,
      tag: data.lots.tag
    })

    const activities = await ActivityService.createDefault(
      data.surface,
      data.dateCrop
    )

    const crop = await CropService.handleDataCrop(
      data,
      company,
      lots,
      activities,
      { producers: req.user }
    )

    res.status(201).json(crop)
  }

  /**
   * Update a crop
   *
   * @param Request req
   * @param Response res
   *
   * @return Response
   */
  public async update (req: Request, res: Response) {
    const user: UserSchema = req.user
    const data = JSON.parse(req.body.data)
    let company = null

    company = (await CompanyService.search({ identifier: data.identifier }))[0]

    if (company) {
      await UserService.update(
        { email: user.email },
        {
          companies: [company._id]
        }
      )
    }
    const crop = await Crop.findById(req.params.id)

    crop.company = company ? company._id : null

    await crop.save()

    res.status(200).json(crop)
  }

  /**
   * Delete one crop.
   *
   * @param  Request req
   * @param  Response res
   *
   * @return Response
   */
  public async delete (req: Request, res: Response) {
    const isCancelled = await CropService.cancelled(req.params.id)

    if (!isCancelled) {
      return res.status(400).json({
        error: true,
        message: 'deleted not allowed'
      })
    }

    res.status(200).json({
      message: 'deleted successfully'
    })
  }
}

export default new CropsController()
