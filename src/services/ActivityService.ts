import models from '../models'
import UploadService from './UploadService'
import { fileExist, removeFile } from '../utils/Files'
import remove from 'lodash/remove'

import { statusActivities } from '../utils/Status'

import { UserSchema } from '../models/user'

const Activity = models.Activity
const ActivityType = models.ActivityType
const TypeAgreement = models.TypeAgreement
const FileDocument = models.FileDocument

interface IActivity {
  name?: String
  dateStart?: String
  dateEnd?: String
  surface?: Number
  type?: String
  crop?: String
  lots?: Array<any>
  dateLimitValidation?: String
  typeAgreement?: String
  supplies?: Array<any>
  evidences?: Array<any>
  status?: String | Array<any>
}

class ActivityService {
  public static async store (activity: IActivity) {
    let statusActivity: Array<any> = []
    if (!this.existStatus(activity)) {
      statusActivity = this.createStatus('COMPLETAR')
      activity.status = statusActivity
    }

    if (this.existStatus(activity)) {
      statusActivity = this.createStatus(activity.status)
      activity.status = statusActivity
    }

    return Activity.create(activity)
  }

  public static async update (id: string, activity: IActivity) {
    let statusActivity: Array<any> = []
    if (!this.existStatus(activity)) {
      statusActivity = this.createStatus('COMPLETAR')
      activity.status = statusActivity
    }

    if (this.existStatus(activity)) {
      statusActivity = this.createStatus(activity.status)
      activity.status = statusActivity
    }

    await Activity.findByIdAndUpdate(id, activity)

    return Activity.findOne({ _id: id })
  }

  public static async getByTag (tag: string) {
    return ActivityType.findOne({ tag })
  }

  public static createDefault (surface: number, name: string, date: string) {
    const typesActivity = ['ACT_SOWING', 'ACT_HARVEST', 'ACT_AGREEMENTS']

    const activities = typesActivity.map(async (item) => {
      const type = await this.getByTag(item)
      const typeAgreement = await TypeAgreement.findOne({ key: 'EXPLO' })
      const activity = await this.store({
        name:
          item === 'ACT_AGREEMENTS'
            ? this.createNameActivity(type, typeAgreement)
            : this.createNameActivity(type, null),
        surface,
        dateLimitValidation: item === 'ACT_AGREEMENTS' ? date : null,
        typeAgreement: item === 'ACT_AGREEMENTS' ? typeAgreement._id : null,
        type: type._id
      })

      return activity._id
    })

    return Promise.all(activities)
  }

  public static async addFiles (activity, evidences, files, user) {
    const filesUploaded = await UploadService.upload(
      files,
      `activities/${activity.key}`
    )

    const documents = filesUploaded.map(async (item, index) => {
      const file = await FileDocument.create({
        ...(item as object),
        ...evidences[index],
        user: user._id
      })

      return file._id
    })

    activity.files = await Promise.all(documents)

    return activity.save()
  }

  public static async removeFiles (fileId: string, activity, filePath: string) {
    if (fileExist(filePath)) {
      removeFile(filePath)

      const fileRemove = await FileDocument.findByIdAndDelete(fileId)

      if (fileRemove) {
        const files = remove(activity.files, function (item) {
          return item === fileId
        })

        activity.files = files

        await activity.save()
      }
      return true
    }

    return false
  }

  public static async changeStatus (activity, status: string) {
    const statusChanged = statusActivities(status)

    activity.status = statusChanged

    return activity.save()
  }

  public static async signUser (activity, user) {
    const signer = activity.signers.filter(
      (item) => item.userId.toString() === user._id.toString()
    )

    if (signer.length > 0) {
      const child = activity.signers.id(signer[0]._id)
      child.signed = true
    }

    await activity.save()

    return Activity.findById(activity._id)
  }

  public static async isCompleteSingers (activity) {
    const signers = activity.signers.filter((item) => !item.signed)

    if (signers.length > 0) {
      return false
    }

    return true
  }

  private static existStatus (activity) {
    return activity.status
  }

  private static createStatus (status) {
    return statusActivities(status)
  }

  private static createNameActivity (typeActivity, typeAgreement) {
    if (typeAgreement) {
      return `${typeActivity.name.es} - ${typeAgreement.name.es}`
    }

    return `${typeActivity.name.es}`
  }
}

export default ActivityService