'use strict'

const moment = require('moment')
const CompanyService = require('../company/CompanyService')
const CommonService = require('../../approvalRegisters/Common')

class StatusService {
  static async getStatusByCrop(cropId, companyId) {
    let statusCrop = {}
    try {
      const company = await CompanyService.getCompanyWithCrops(
        companyId,
        cropId,
        ['after_day_sowing', 'before_day_sowing', 'before_day_sowing']
      )

      const cropProductor = company.toJSON().productors_to[0]
      // Obtenemos una posición del punto donde nos encontramos con respecto a la fecha actual y la fecha de siembra
      // del cultivo
      const statusDay = this.decideDaySowing(cropProductor)

      const result = await CommonService.getApprovalWithRegisters({
        crop_id: cropId,
        stage: 'sowing',
      })

      const cropsAndUsers = await CompanyService.getCompanyWithCropAndUsersBy(
        companyId,
        cropId
      )

      // Decidimos en que estado se encuentra nuestro cultivo parados en un rango de fechas
      // Luego calculamos el procentaje de avance de la siembra del cultivo.

      if (statusDay.xy) {
        statusCrop = this.statusBeforeDayConfigSowing(result[0], cropsAndUsers)
      }

      if (statusDay.y) {
        statusCrop = this.statusbetweenDaySowing(result[0], cropsAndUsers)
      }

      if (statusDay.z) {
        statusCrop = this.statusbetweenDaySowing(result[0], cropsAndUsers)
      }

      if (statusDay.zx) {
        statusCrop = this.statusAfterDaySowing(result[0], cropsAndUsers)
      }

      return statusCrop
    } catch (error) {
      console.log(error)
    }
  }

  //estoy en XY
  static statusBeforeDayConfigSowing(approval, crop) {
    if (approval.Register.length === 0) {
      return {
        percent: 0,
        status: 'created',
      }
    }

    const progressCrop = this.calculateProgress(approval, crop)

    if (
      progressCrop >=
      crop.productors_to[0].roles_companies_crops.expected_surface_percent
    ) {
      return {
        percent: progressCrop,
        status: 'complete',
      }
    }

    return {
      percent: progressCrop,
      status: 'in_progress',
    }
  }

  //estoy en Y o en Z
  static statusbetweenDaySowing(approval, crop) {
    if (approval.Register.length === 0) {
      return {
        percent: 0,
        status: 'warning',
      }
    }
    const progressCrop = this.calculateProgress(approval, crop)

    if (
      progressCrop >=
      crop.productors_to[0].roles_companies_crops.expected_surface_percent
    ) {
      return {
        percent: progressCrop,
        status: 'complete',
      }
    }

    return {
      percent: progressCrop,
      status: 'in_progress',
    }
  }

  static statusAfterDaySowing(approval, crop) {
    if (approval.Register.length === 0) {
      return {
        percent: 0,
        status: 'danger',
      }
    }

    const progressCrop = this.calculateProgress(approval, crop)

    if (
      progressCrop >=
      crop.productors_to[0].roles_companies_crops.expected_surface_percent
    ) {
      return {
        percent: progressCrop,
        status: 'complete',
      }
    }

    return {
      percent: progressCrop,
      status: 'danger',
    }
  }
  static decideDaySowing(crop) {
    const decide = {
      xy: false,
      y: false,
      z: false,
      zx: false,
    }
    const now = moment()
    const startMinusDateSowing = moment(crop.start_at).subtract(
      crop.roles_companies_crops.before_day_sowing,
      'days'
    )
    const startDateSowign = moment(crop.start_at)
    const startAddDateSowing = moment(crop.start_at).add(
      crop.roles_companies_crops.after_day_sowing,
      'days'
    )

    if (now <= startMinusDateSowing) {
      decide.xy = true
    }

    if (now > startMinusDateSowing && now <= startDateSowign) {
      decide.y = true
    }

    if (now >= startDateSowign && now < startAddDateSowing) {
      decide.z = true
    }

    if (now >= startAddDateSowing) {
      decide.zx = true
    }

    return decide
  }

  static calculateProgress(approval, crop) {
    const progress = approval.Register.map((item) => {
      const complete = this.registerComplete(
        item.Signs,
        crop.productors_to[0].users
      )

      if (complete) {
        return {
          percent:
            Math.round(
              (parseInt(JSON.parse(item.data).units) /
                crop.productors_to[0].surface) *
                100
            ) / 100,
        }
      }
    })
      .filter((item) => item)
      .reduce((a, b) => a + (b['percent'] || 0), 0)

    return progress
  }

  static registerComplete(signs, users) {
    let complete = true
    for (const user of users) {
      if (signs.filter((item) => item.user_id === user.id).length === 0) {
        complete = false
        return complete
      }
    }
    return complete
  }
}

module.exports = StatusService
