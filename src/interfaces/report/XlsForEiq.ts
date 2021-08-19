export interface ReportXlsForEiq {
  cropId: string
  activityId: string
  achievementId: string
  identifier: string
  companyName: string
  cropTypeName: string
  cropName: string
  establishments: Array<string>
  lotName: string
  lotSurface: number
  kmzLocation: string
  achievementSuppliesId: string
  achievementSuppliesName: string
  achievementSuppliesUnit: string
  achievementSuppliesQuantity: number
  achievementSuppliesTotal: number
  achievementSupplyId: string
  achievementSupplyEiq: number
  achievementDate: string
  achievementSurface: number
  evidences: Array<string>
  activitySuppliesId: string
  activitySuppliesUnit: string
  activitySuppliesQuantity: number
  activitySuppliesTotal: number
  activitySuppliesEiq: number
  activityDateStart: string
  activitySurface: number
}