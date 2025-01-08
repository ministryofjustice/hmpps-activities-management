import { when } from 'jest-when'
import atLeast from '../../jest.setup'

import { ServiceUser } from '../@types/express'
import AlertsApiClient from '../data/alertsApiClient'
import AlertsService from './alertsService'
import { Alert } from '../@types/alertsAPI/types'

jest.mock('../data/alertsApiClient')

describe('Alerts service', () => {
  const alertsApiClient = new AlertsApiClient()
  const alertsService = new AlertsService(alertsApiClient)

  const user = {
    activeCaseLoadId: 'MDI',
  } as ServiceUser

  describe('getAlertsForPrisoners', () => {
    it('should respond with the alerts for the prisoners given, from the alerts API', async () => {
      const apiResponse: Alert[] = [
        {
          alertUuid: '6cd3d3cb-fe76-4746-b2ea-a6968a63c2aa',
          prisonNumber: 'G4793VF',
          alertCode: {
            alertTypeCode: 'X',
            alertTypeDescription: 'Security',
            code: 'XTACT',
            description: 'Terrorism Act or Related Offence',
          },
          description: 'TACT',
          authorisedBy: 'TEST_GEN',
          activeFrom: '2023-03-20',
          activeTo: '2026-03-20',
          isActive: true,
          createdAt: '2023-03-20T14:14:27',
          createdBy: 'SCH_ACTIVITY',
          createdByDisplayName: 'Schedule Activity',
          lastModifiedAt: '2023-07-20T14:14:27',
          lastModifiedBy: 'TEST_GEN',
          lastModifiedByDisplayName: 'TESTER',
          activeToLastSetAt: '2023-07-20T14:14:27',
          activeToLastSetBy: 'TEST_GEN',
          activeToLastSetByDisplayName: 'TESTER',
        },
      ]

      const prisonerNumbers = ['G4793VF', 'Q6755TY']

      when(alertsApiClient.getAlertsForPrisoners).calledWith(atLeast(prisonerNumbers)).mockResolvedValue(apiResponse)

      const actualResult = await alertsService.getAlertsUsingPrisonerNumbers(prisonerNumbers, user)

      expect(actualResult).toEqual(apiResponse)
      expect(alertsApiClient.getAlertsForPrisoners).toHaveBeenCalledWith(prisonerNumbers, user)
    })
  })
})
