import { FileArray } from 'express-fileupload'
import UploadService from '../UploadService'
import remove from 'lodash/remove'
import { fileExist, removeFile } from '../../utils/Files'
import models from '../../models'

const FileDocument = models.FileDocument
class ServiceBase {

    /**
     * Upload Files and create Document Files.
     *
     * @param document
     * @param evidences
     * @param files
     * @param user
     */
  public static async addFiles (document, evidences, files: FileArray, user, path: string) {
    const filesUploaded = await UploadService.upload(
          files,
         `${path}`
        )

    const documents = filesUploaded.map(async (item, index) => {
      const file = await FileDocument.create({
        ...(item as object),
        ...evidences[index],
        user: user._id
      })

      return file._id
    })

    document.files = await Promise.all(documents)

    return document.save()
  }

  /**
   * Remove Files and DocumentFile.
   *
   * @param fileId
   * @param document
   * @param filePath
   */
  public static async removeFiles (fileId: string, document, filePath: string) {
    if (fileExist(filePath)) {
      removeFile(filePath)

      const fileRemove = await FileDocument.findByIdAndDelete(fileId)

      if (fileRemove) {
        const files = remove(document.files, function (item) {
          return item === fileId
        })

        document.files = files

        await document.save()
      }
      return true
    }

    return false
  }

  /**
   * Sing User.
   *
   * @param document
   * @param user
   */
  public static async signUser (document, user) {
    console.log(document)
    console.log(user)
    const signer = document.signers.filter(
      (item) => item.userId.toString() === user._id.toString()
    )

    if (signer.length > 0) {
      const child = document.signers.id(signer[0]._id)
      child.signed = true
    }

    await document.save()
  }
}

export default ServiceBase