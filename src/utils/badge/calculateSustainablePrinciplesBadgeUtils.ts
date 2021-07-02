import { IBadge } from '../../interfaces'

export const calculateSustainablePrinciplesBadge = (
  activitiesSurfaces: number,
  cropSurface: number,
  badge: IBadge
) => {
  const average = (activitiesSurfaces / cropSurface) * 100

  if (average >= badge.goalReach) {
    return badge
  }

  return false
}
