'use static'

const _ = require('lodash')
const Sequelize = require('sequelize')
const Common = require('../../services/approvalRegisters/Common')
const CropService = require('../../services/dashboard/crops/CropService')
const CompanyService = require('../../services/dashboard/company/CompanyService')
const Productions = require('../../models').productions
const ProductionStage = require('../../models').production_stage

const SINGNED_OPTS = {
  label: 'Firmado',
  backgroundColor: '#5FD856',
  stack: '1',
}

const REGISTERED_OPTS = {
  label: 'Registrado',
  backgroundColor: '#FFD101',
  stack: '1',
}

const TO_REGISTER_OPTS = {
  label: 'A Registrar',
  backgroundColor: '#ccc',
  stack: '2',
}

class GraphsController {
  static async surfacePerCrop(req, res) {
    const registeredSurfaces = await CropService.getCropRegisteredSurfacesBy({
      company: req.params.companyId,
    })

    /*    return res.json(
      await Signers.checkIfCompleted({ stage: 'fields', cropId: 25 })
    ) */

    // separar los cultivos por id que correspondan a la compania
    const companiesProductors = await CompanyService.getCompaniesProductors(
      req.params.companyId
    )

    let crops = {}

    companiesProductors.forEach((el) => {
      el.productors_to.forEach((el) => {
        crops[el.id] = el
      })
    })

    const productions = await Productions.findAll({
      include: [
        {
          model: ProductionStage,
          as: 'Stage',
          where: {
            label: 'fields',
          },
        },
      ],
      where: {
        id: {
          [Sequelize.Op.in]: Object.keys(crops),
        },
      },
    }).map((el) => ({
      id: el.id,
      crop_id: el.crop_id,
      surfaceSelected: el.Stage[0].data_formatter
        .filter((el) => Object.keys(el.lots).length > 0)
        .map((el) => ({
          ...el,
          lots: _.filter(el.lots, (el) => el.isChecked).reduce(
            (prev, el) => prev + el.lot.surface,
            0
          ),
        }))
        .reduce((prev, el) => prev + el.lots, 0),
    }))

    // eslint-disable-next-line require-atomic-updates
    crops = _.map(crops, (crop) => ({
      ...crop,
      production: productions.find((el) => el.crop_id === crop.id),
    }))

    let register = await Common.getApprovalWithRegisters({ stage: 'fields' })

    register = register.map((el) => ({
      crop_id: el.crop_id,
      signs: el.Register[0].Signs,
    }))

    // eslint-disable-next-line require-atomic-updates
    crops = _.map(crops, (crop) => {
      const reg = register.find((el) => el.crop_id === crop.id)
      return {
        crop_id: crop.id,
        crop_type_id: crop.crop_type.id,
        surfaceSelected: crop.production ? crop.production.surfaceSelected : 0,
        usersCount: crop.users.length,
        completed: reg ? reg.signs.length === crop.users.length : false,
      }
    })

    // eslint-disable-next-line require-atomic-updates
    crops = _(crops)
      .filter((el) => el.completed)
      .map(({ crop_id, crop_type_id, surfaceSelected }) => {
        return {
          id: crop_id,
          crop_type_id: crop_type_id,
          surfaceSelected,
        }
      })
      .groupBy('crop_type_id')
      .map((el) =>
        _.reduce(
          el,
          (prev, curr) => {
            return {
              ...prev,
              typeId: curr.crop_type_id,
              surfaceSelected: prev.surfaceSelected + curr.surfaceSelected,
            }
          },
          { surfaceSelected: 0 }
        )
      )

    const signedSurfaces = registeredSurfaces.map((register) => {
      return {
        ...register,
        completed: crops.find((el) => el.typeId === register.typeId)
          ? crops.find((el) => el.typeId === register.typeId).surfaceSelected
          : 0,
      }
    })

    res.json({
      labels: registeredSurfaces.map((el) => el.name),
      datasets: [
        {
          ...SINGNED_OPTS,
          data: signedSurfaces.map((el) => el.completed),
        },
        {
          ...TO_REGISTER_OPTS,
          data: registeredSurfaces.map((el) => el.surface),
        },
      ],
    })
  }
}

module.exports = GraphsController
