export const roles = ['MARKETER', 'PROVIDER', 'CAM']

export const errors = [
  { key: '001', code: 'NOT_AUTHORIZATION_EXPORT' },
  { key: '002', code: 'ERROR_KMZ_INVALID_FORMAT' },
  { key: '003', code: 'ERROR_FILE_EXTENSION' },
  { key: '004', code: 'NAME_LOT_DUPLICATED' },
  { key: '005', code: 'RESOURCE_NOT_FOUND' }
  { key: '006', code: 'BADGE_TYPE_DUPLICATED' }
  { key: '007', code: 'DATA_NOT_FOUND' }
]

export enum emailTemplates {
  NOTIFICATION_COLLABORATOR = 'notification-collab',
  NOTIFICATION_ACTIVITY = 'notification-activity'
}
