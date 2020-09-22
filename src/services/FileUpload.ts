import { UploadedFile } from 'express-fileupload'
import { getFullPath, makeDirIfNotExists } from '../utils/Files'

const VALID_FORMATS_FILES = `text.*|image.*|application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document|application/octet-stream|application/vnd.google-earth.kmz|application/vnd.google-earth.kml`

class FileUpload {
  private files
  private destination: string

  constructor (files, destination: string) {
    this.files = files
    this.destination = destination
  }

  public async store (): Promise<any> {
    if (Object.keys(this.files).length === 0) {
      throw new Error('No files were uploaded.')
    }

    const movePromises = Object.keys(this.files).map(
      (key) =>
        new Promise(async (res, rej) => {
          try {
            if (this.files[key].length > 0) {
              let filesStored = this.files[key].map(async (file) => {
                const result = await this.save(file)
                return result
              })

              filesStored = await Promise.all(filesStored)
              res(filesStored)
            }

            const fileStored = await this.save(this.files[key])
            res(fileStored)
          } catch (error) {
            return rej(error)
          }
        })
    )

    const result = await Promise.all(movePromises)

    return Array.isArray(result[0]) ? result[0] : result
  }

  async save (file: UploadedFile) {
    if (!this.validTypes(file)) {
      throw new Error('File extension is rejected')
    }

    const fileNameArray = file.name.trim().split('.')

    const renameFile = `${file.md5}.${fileNameArray.pop()}`

    const path = await makeDirIfNotExists(
      getFullPath(`${process.env.DIR_UPLOADS}/${this.destination}`)
    )

    await file.mv(`${path}/${renameFile}`)

    return {
      path: `${process.env.DIR_UPLOADS}/${this.destination}/${renameFile}`,
      nameFile: renameFile,
      fileType: file.mimetype
    }
  }

  validTypes (file) {
    return file.mimetype.match(VALID_FORMATS_FILES) !== null
  }
}

export default FileUpload
