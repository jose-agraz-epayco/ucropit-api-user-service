import { __, setLocale } from 'i18n'
import { Crop } from '../../interfaces'
import { translateActivities } from '../activities'
import { translateCropType } from './'

export const translateCropActivities = (crop: Crop, lang: string) => {
  setLocale(lang)
  const pending = translateActivities(crop.pending, lang)
  const toMake = translateActivities(crop.toMake, lang)
  const done = translateActivities(crop.done, lang)
  const finished = translateActivities(crop.finished, lang)
  crop.cropType = translateCropType(crop, lang)

  return {
    ...crop,
    toMake,
    pending,
    done,
    finished
  }
}

export const translateCrop = (crop: Crop, lang: string) => {
  const translated = translateActivities(crop.activities, lang)

  return {
    ...crop,
    activities: translated
  }
}
