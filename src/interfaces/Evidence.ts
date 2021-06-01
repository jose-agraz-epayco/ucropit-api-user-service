export interface Evidence {
  _id: string
  nameFile?: string
  date?: Date | string
  path?: string
  name?: string
  pathThumbnails?: string
  pathIntermediate?: string
  description?: string
  isSatelliteImage?: boolean
  settings?: any
  meta?: any
  user?: string
  imagePathIntermediate?: string
  imagePathThumbnails?: string
}
