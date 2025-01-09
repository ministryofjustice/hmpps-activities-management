import { when } from 'jest-when'
import atLeast from '../../jest.setup'

import { ServiceUser } from '../@types/express'
import AlertsApiClient from '../data/alertsApiClient'
import AlertsService, { PrisonerAlertDetails, PrisonerAlertResults, PrisonerDetails } from './alertsService'
import { Alert } from '../@types/alertsAPI/types'

jest.mock('../data/alertsApiClient')

describe('Alerts service', () => {
  let alertsApiClient: AlertsApiClient
  let alertsService: AlertsService

  const user = {
    activeCaseLoadId: 'MDI',
  } as ServiceUser

  let prisonerMaggie: PrisonerDetails
  let prisonerDave: PrisonerDetails

  let tectAlertForMaggie: Partial<Alert>
  let xcuAlertForMaggie: Partial<Alert>
  let peepAlertForDave: Partial<Alert>

  let maggieResult: PrisonerAlertDetails
  let daveResult: PrisonerAlertDetails

  beforeEach(() => {
    alertsApiClient = new AlertsApiClient()
    alertsService = new AlertsService(alertsApiClient)

    prisonerMaggie = {
      number: 'B1111B',
      name: 'Maggie Jones',
      category: 'H',
    }

    prisonerDave = {
      number: 'A1111A',
      name: 'Dave Smith',
      category: 'A',
    }

    tectAlertForMaggie = {
      prisonNumber: 'B1111B',
      isActive: true,
      alertCode: {
        alertTypeCode: '',
        alertTypeDescription: '',
        code: 'TECT',
        description: 'Terrorism Act or Related Offence',
      },
    }

    xcuAlertForMaggie = {
      prisonNumber: 'B1111B',
      isActive: true,
      alertCode: {
        alertTypeCode: '',
        alertTypeDescription: '',
        code: 'XCU',
        description: 'Controlled Unlock',
      },
    }

    peepAlertForDave = {
      prisonNumber: 'A1111A',
      isActive: true,
      alertCode: {
        alertTypeCode: '',
        alertTypeDescription: '',
        code: 'PEEP',
        description: 'Personal Emergency Evacuation Plan',
      },
    }

    maggieResult = {
      number: prisonerMaggie.number,
      name: prisonerMaggie.name,
      category: prisonerMaggie.category,
      alerts: [
        {
          alertCode: tectAlertForMaggie.alertCode.code,
        },
        {
          alertCode: xcuAlertForMaggie.alertCode.code,
        },
      ],
      alertDescriptions: [xcuAlertForMaggie.alertCode.description, tectAlertForMaggie.alertCode.description],
      hasBadgeAlerts: true,
      hasRelevantCategories: true,
    }

    daveResult = {
      number: prisonerDave.number,
      name: prisonerDave.name,
      category: prisonerDave.category,
      alerts: [
        {
          alertCode: peepAlertForDave.alertCode.code,
        },
      ],
      alertDescriptions: [peepAlertForDave.alertCode.description],
      hasBadgeAlerts: true,
      hasRelevantCategories: true,
    }
  })

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

      when(alertsApiClient.getAlertsForPrisoners)
        .calledWith(atLeast(prisonerNumbers))
        .mockResolvedValue({ content: apiResponse })

      const actualResult = await alertsService.getAlertsUsingPrisonerNumbers(prisonerNumbers, user)

      expect(actualResult).toEqual(apiResponse)
      expect(alertsApiClient.getAlertsForPrisoners).toHaveBeenCalledWith(prisonerNumbers, user)
    })
    it('filters out inactive alerts', async () => {
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
        {
          alertUuid: '2',
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
          isActive: false,
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

      when(alertsApiClient.getAlertsForPrisoners)
        .calledWith(atLeast(prisonerNumbers))
        .mockResolvedValue({ content: apiResponse })

      const actualResult = await alertsService.getAlertsUsingPrisonerNumbers(prisonerNumbers, user)

      expect(actualResult).toEqual([apiResponse[0]])
      expect(alertsApiClient.getAlertsForPrisoners).toHaveBeenCalledWith(prisonerNumbers, user)
    })
  })
  describe('getAlertDetails', () => {
    it('should return alerts when all alerts from API are matched', async () => {
      const prisoners = [prisonerDave, prisonerMaggie]

      const expectedOffenderNumbers = prisoners.map(prisoner => prisoner.number)

      const apiResponse = [peepAlertForDave, tectAlertForMaggie, xcuAlertForMaggie] as unknown as Alert[]

      when(alertsApiClient.getAlertsForPrisoners)
        .calledWith(atLeast(expectedOffenderNumbers))
        .mockResolvedValue({ content: apiResponse })

      const actualResults = await alertsService.getAlertDetails(prisoners, user)

      const expectedResults = {
        numPrisonersWithAlerts: 2,
        prisoners: [maggieResult, daveResult],
      }

      expect(actualResults).toEqual(expectedResults)
    })
    it('should return alerts ignoring expired alerts and where category is relevant', async () => {
      const prisoners = [prisonerDave, prisonerMaggie]

      const expectedOffenderNumbers = prisoners.map(prisoner => prisoner.number)

      tectAlertForMaggie.isActive = false

      const apiResponse = [peepAlertForDave, tectAlertForMaggie, xcuAlertForMaggie] as Alert[]

      when(alertsApiClient.getAlertsForPrisoners)
        .calledWith(atLeast(expectedOffenderNumbers))
        .mockResolvedValue({ content: apiResponse })

      const actualResults = await alertsService.getAlertDetails(prisoners, user)

      maggieResult.alerts = [{ alertCode: xcuAlertForMaggie.alertCode.code }]
      maggieResult.alertDescriptions = [xcuAlertForMaggie.alertCode.description]

      const expectedResults = {
        numPrisonersWithAlerts: 2,
        prisoners: [daveResult, maggieResult],
      }

      expect(actualResults).toEqual(expectedResults)
    })
    it('should return alerts ignoring inactive alerts and where category is relevant', async () => {
      const prisoners = [prisonerDave, prisonerMaggie]

      const expectedOffenderNumbers = prisoners.map(prisoner => prisoner.number)

      tectAlertForMaggie.isActive = false

      const apiResponse = [peepAlertForDave, tectAlertForMaggie, xcuAlertForMaggie] as Alert[]

      when(alertsApiClient.getAlertsForPrisoners)
        .calledWith(atLeast(expectedOffenderNumbers))
        .mockResolvedValue({ content: apiResponse })

      const actualResults = await alertsService.getAlertDetails(prisoners, user)

      maggieResult.alerts = [{ alertCode: xcuAlertForMaggie.alertCode.code }]
      maggieResult.alertDescriptions = [xcuAlertForMaggie.alertCode.description]

      const expectedResults = {
        numPrisonersWithAlerts: 2,
        prisoners: [daveResult, maggieResult],
      }

      expect(actualResults).toEqual(expectedResults)
    })
    it('should return alerts ignoring expired alerts and where category is irrelevant', async () => {
      const prisoners = [prisonerDave, prisonerMaggie]

      const expectedOffenderNumbers = prisoners.map(prisoner => prisoner.number)

      prisonerMaggie.category = 'X'
      tectAlertForMaggie.isActive = false

      const apiResponse = [peepAlertForDave, tectAlertForMaggie, xcuAlertForMaggie] as Alert[]

      when(alertsApiClient.getAlertsForPrisoners)
        .calledWith(atLeast(expectedOffenderNumbers))
        .mockResolvedValue({ content: apiResponse })

      const actualResults = await alertsService.getAlertDetails(prisoners, user)

      maggieResult.category = prisonerMaggie.category
      maggieResult.alerts = [{ alertCode: xcuAlertForMaggie.alertCode.code }]
      maggieResult.alertDescriptions = [xcuAlertForMaggie.alertCode.description]
      maggieResult.hasBadgeAlerts = true
      maggieResult.hasRelevantCategories = false

      const expectedResults = {
        numPrisonersWithAlerts: 2,
        prisoners: [daveResult, maggieResult],
      }

      expect(actualResults).toEqual(expectedResults)
    })
    it('should return alerts where an alert is irrelevant and category is irrelevant', async () => {
      const prisoners = [prisonerDave, prisonerMaggie]

      const expectedOffenderNumbers = prisoners.map(prisoner => prisoner.number)

      prisonerMaggie.category = 'X'

      const apiResponse = [peepAlertForDave, tectAlertForMaggie] as unknown as Alert[]

      when(alertsApiClient.getAlertsForPrisoners)
        .calledWith(atLeast(expectedOffenderNumbers))
        .mockResolvedValue({ content: apiResponse })

      const actualResults = await alertsService.getAlertDetails(prisoners, user)

      maggieResult.category = prisonerMaggie.category
      maggieResult.alerts = [{ alertCode: tectAlertForMaggie.alertCode.code }]
      maggieResult.alertDescriptions = [tectAlertForMaggie.alertCode.description]
      maggieResult.hasBadgeAlerts = false
      maggieResult.hasRelevantCategories = false

      const expectedResults = {
        numPrisonersWithAlerts: 2,
        prisoners: [daveResult, maggieResult],
      }

      expect(actualResults).toEqual(expectedResults)
    })
    it('should return alerts when there are no alerts', async () => {
      const prisoners = [prisonerDave, prisonerMaggie]

      const expectedOffenderNumbers = prisoners.map(prisoner => prisoner.number)

      prisonerDave.category = 'X'
      prisonerMaggie.category = 'X'
      peepAlertForDave.isActive = false
      tectAlertForMaggie.isActive = false

      const apiResponse = [peepAlertForDave, tectAlertForMaggie] as unknown as Alert[]

      when(alertsApiClient.getAlertsForPrisoners)
        .calledWith(atLeast(expectedOffenderNumbers))
        .mockResolvedValue({ content: apiResponse })

      const actualResults = await alertsService.getAlertDetails(prisoners, user)

      daveResult.category = prisonerMaggie.category
      daveResult.alerts = []
      daveResult.alertDescriptions = []
      daveResult.hasBadgeAlerts = false
      daveResult.hasRelevantCategories = false
      maggieResult.category = prisonerMaggie.category
      maggieResult.alerts = []
      maggieResult.alertDescriptions = []
      maggieResult.hasBadgeAlerts = false
      maggieResult.hasRelevantCategories = false

      const expectedResults = {
        numPrisonersWithAlerts: 0,
        prisoners: [daveResult, maggieResult],
      }

      expect(actualResults).toEqual(expectedResults)
    })
    it('should sort alerts correctly', async () => {
      const prisonerAlan = {
        number: 'D1111D',
        name: 'Alan Jones',
        category: 'A',
      }

      const prisonerAlice = {
        number: 'E1111E',
        name: 'Alice Robins',
      }

      const ocgAlertForAlice = {
        prisonNumber: 'E1111E',
        isActive: true,
        alertCode: {
          alertTypeCode: '',
          alertTypeDescription: '',
          code: 'OCG',
          description: 'OCG Nominal',
        },
      }

      const alanResult = {
        number: prisonerAlan.number,
        name: prisonerAlan.name,
        category: prisonerAlan.category,
        alerts: [] as PrisonerAlertResults[],
        alertDescriptions: [] as string[],
        hasBadgeAlerts: true,
        hasRelevantCategories: true,
      }

      const aliceResult = {
        number: prisonerAlice.number,
        name: prisonerAlice.name,
        alerts: [
          {
            alertCode: ocgAlertForAlice.alertCode.code,
          },
        ],
        alertDescriptions: [ocgAlertForAlice.alertCode.description],
        hasBadgeAlerts: false,
        hasRelevantCategories: false,
      }

      const prisoners = [prisonerAlice, prisonerDave, prisonerMaggie, prisonerAlan]

      const expectedOffenderNumbers = prisoners.map(prisoner => prisoner.number)

      const apiResponse = [
        peepAlertForDave,
        tectAlertForMaggie,
        xcuAlertForMaggie,
        ocgAlertForAlice,
      ] as unknown as Alert[]

      when(alertsApiClient.getAlertsForPrisoners)
        .calledWith(atLeast(expectedOffenderNumbers))
        .mockResolvedValue({ content: apiResponse })

      const actualResults = await alertsService.getAlertDetails(prisoners, user)

      const expectedResults = {
        numPrisonersWithAlerts: 3,
        prisoners: [maggieResult, daveResult, aliceResult, alanResult],
      }

      expect(actualResults).toEqual(expectedResults)
    })
  })
})
