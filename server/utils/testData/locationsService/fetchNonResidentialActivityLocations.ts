import { LocationWithDescription } from '../../../services/locationsService'

export const workshop: LocationWithDescription = {
  id: '22222222-2222-2222-2222-222222222222',
  prisonId: 'RSI',
  code: 'MDI-WORK-1',
  locationType: 'LOCATION',
  description: 'WORKSHOP 1',
} as LocationWithDescription

export const aWing: LocationWithDescription = {
  id: '11111111-1111-1111-1111-111111111111',
  prisonId: 'RSI',
  code: 'AWING',
  locationType: 'RESIDENTIAL_UNIT',
  localName: 'A Wing',
  description: 'A Wing',
} as LocationWithDescription

export const box1: LocationWithDescription = {
  id: '33333333-3333-3333-3333-333333333333',
  prisonId: 'RSI',
  code: 'Box1',
  locationType: 'BOX',
  description: 'Box 1',
} as LocationWithDescription

export const nonResidentialActivityLocations: LocationWithDescription[] = [workshop, aWing, box1]
