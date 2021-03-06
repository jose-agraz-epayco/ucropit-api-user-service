import ServiceBase from './common/ServiceBase'
import CropService from './CropService'
import ActivityService from './ActivityService'
import { Numbers } from '../utils'
import _ from 'lodash'

const activitiesTags: Array<string> = [
  'ACT_SOWING',
  'ACT_HARVEST',
  'ACT_APPLICATION',
  'ACT_FERTILIZATION',
  'ACT_TILLAGE',
  'ACT_MONITORING'
]

class ChartDataService extends ServiceBase {
  /**
   * Generate data to Chart Agreement
   *
   * @param crops
   */
  public static generateDataAgreement(crops) {
    const listSummarySurfaces: any =
      CropService.createDataCropToChartSurface(crops)

    const sortDataList = this.sortData(listSummarySurfaces).filter(
      (item) => item.total > 0
    )

    const summarySortData = this.summaryTotalPerMonth(
      CropService.summaryData(sortDataList)
    )

    const labels: any = summarySortData.map((item) => item.date)
    const data: any = summarySortData.map((item) =>
      Numbers.roundToTwo(item.total)
    )

    return { labels, data }
  }

  public static generateDataActivities(crops) {
    let labels = []
    const groupData = activitiesTags.map((tag) => {
      const dataCrop = crops.map((crop) => {
        const groupDataActivitiesDone =
          ActivityService.groupSurfaceAndDateAchievements(crop.done, tag)

        const groupDataActivitiesFinished =
          ActivityService.groupSurfaceAndDateAchievements(crop.finished, tag)

        return groupDataActivitiesDone.concat(groupDataActivitiesFinished)
      })

      const sortGroupData = this.sortData(_.flatten(dataCrop)).filter(
        (item) => item.total > 0
      )

      const dataActivitiesSummary = this.summaryTotalPerMonth(
        CropService.summaryData(sortGroupData)
      )

      const labels: any = dataActivitiesSummary.map((item) => item.date)

      const data: any = dataActivitiesSummary.map((item) =>
        Numbers.roundToTwo(item.total)
      )

      return { labels, data, tag }
    })

    for (const data of groupData) {
      labels = labels.concat(data.labels)
    }

    labels = this.mergeDataLabelsActivity(labels)

    labels.sort(function (a, b) {
      const currentDate = a.substr(3, 4).split(' ') + a.substr(0, 2).split(' ')
      const cropDate = b.substr(3, 4).split(' ') + b.substr(0, 2).split(' ')
      return currentDate - cropDate
    })

    const dataChartActivities = groupData.map((item) => {
      const data = this.dataActivity(item.data, labels, item.labels)

      return {
        tag: item.tag,
        data: data
      }
    })

    return { data: dataChartActivities, labels }
  }

  private static dataActivity(data, labels, activityLabel) {
    const newDataSet = []
    if (data.length === 0) return newDataSet

    for (const label of labels) {
      const existLabel = activityLabel.find((item) => item === label)

      if (existLabel) {
        const pos = activityLabel.indexOf(label)
        newDataSet.push(data[pos])
      } else {
        newDataSet.push(0)
      }
    }

    return newDataSet
  }
  private static mergeDataLabelsActivity(labels: Array<string>) {
    return labels.filter(this.onlyUniqueLabels)
  }

  private static onlyUniqueLabels(value, index, self) {
    return self.indexOf(value) === index
  }

  /**
   * Summary total per Month.
   *
   * @param list
   */
  private static summaryTotalPerMonth(list: Array<any>) {
    let total = 0
    return list.map((item) => {
      total += item.total
      return {
        date: item.date,
        total: total
      }
    })
  }
}

export default ChartDataService
