import moment from 'moment'
import { calculateCropVolumeUtils, Numbers } from '../'

export const getActivitiesOrderedByDateUtils = ({ activities }) => {
  const activitiesRes = activities
    .map(
      ({
        _id,
        achievements,
        type: { tag: TypeActivity },
        signers,
        name,
        lots,
        surface,
        storages,
        dateStart,
        dateEnd,
        supplies,
        pay: payEntry,
        dateObservation,
        status,
        unitType
      }) => {
        let percent: number = 0
        const pay = payEntry ? payEntry : 0
        const { key: keyUnitType, name: nameUnitType } = unitType || {}

        if (TypeActivity === 'ACT_AGREEMENTS') {
          return null
        }

        if (
          TypeActivity === 'ACT_SOWING' ||
          TypeActivity === 'ACT_APPLICATION' ||
          TypeActivity === 'ACT_TILLAGE' ||
          TypeActivity === 'ACT_FERTILIZATION'
        ) {
          percent = !!achievements.length
            ? achievements.reduce((a, b) => a + b.percent, 0)
            : 0
        }
        if (
          TypeActivity === 'ACT_MONITORING' ||
          TypeActivity === 'ACT_HARVEST'
        ) {
          const isSigned = signers.filter(({ signed }) => !signed)
          percent = !(isSigned.length > 0) && signers.length !== 0 ? 100 : 0
        }

        return {
          dateOrder: dateEnd ? dateEnd : _id.getTimestamp(),
          status: status[0].name.es,
          _id,
          name,
          percent,
          unitType: nameUnitType ? nameUnitType.es : null,
          tag: TypeActivity,
          dateStart: dateStart ? dateStart : null,
          dateEnd: dateEnd ? dateEnd : null,
          lots: lots.length,
          surface,
          volume: Numbers.roundToTwo(
            calculateCropVolumeUtils(keyUnitType, pay, surface)
          ),
          pay,
          dateObservation: dateObservation ? dateObservation : null,
          signed: !achievements.length ? signers.length : null,
          signedIf: !achievements.length
            ? signers.filter(({ signed }) => !!signed).length
            : null,
          supplies,
          storages: storages
            ? storages.map(
                ({
                  tonsHarvest,
                  storageType: {
                    name: { es: storageTypeName }
                  }
                }) => {
                  return { tonsHarvest, storageTypeName }
                }
              )
            : [],
          achievements: getDataAchievements(achievements)
        }
      }
    )
    .filter((item) => item)

  return activitiesRes.sort((a, b) =>
    moment(a.dateOrder).diff(moment(b.dateOrder))
  )
}

const getDataAchievements = (achievements): Object[] => {
  return achievements
    .map(({ dateAchievement, lots, surface, signers, supplies, _id }) => {
      return {
        _id,
        dateAchievement,
        lots: lots.length,
        surface,
        supplies,
        signed: signers.length,
        signedIf: signers.filter(({ signed }) => !!signed).length
      }
    })
    .filter((item) => item)
}
