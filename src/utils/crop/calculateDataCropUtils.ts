import util from 'util'
import { Numbers } from '../Numbers'
import { calculateCropVolumeUtils } from './calculateCropVolumeUtils'
import { getLots } from '../lots'

export const calculateDataCropUtils = ({
    surface,
    pay: payEntry,
    dateCrop,
    name,
    activities,
    lots,
    company,
    unitType,
    cropType: { key: cropTypeKey }
  }, activitiesWithEiq): Object => {
  const pay = payEntry ?? 0
  let eiq: number = 0
  const { key: keyUnitType, name: nameUnitType } = unitType || {}
  eiq = activitiesWithEiq.reduce((a, b) => a + b.eiq, 0)
  // console.log(util.inspect(lots, { showHidden: false, depth: null }))

  return {
    surface,
    volume: Numbers.roundToTwo(
      calculateCropVolumeUtils(keyUnitType, pay, surface)
    ),
    pay,
    dateCrop,
    name,
    eiq: Numbers.roundToTwo(eiq),
    cropTypeKey,
    company,
    lotsQuantity: lots.length ? lots[0].data.length : 0,
    lots: lots.length ? getLots(lots[0].data,activitiesWithEiq) : []
  }
}
