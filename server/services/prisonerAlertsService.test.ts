import { when } from 'jest-when'
import atLeast from '../../jest.setup'
import PrisonService from './prisonService'
import { ServiceUser } from '../@types/express'
import PrisonerAlertsService, {
  PrisonerAlertDetails,
  PrisonerAlertResults,
  PrisonerDetails,
} from './prisonerAlertsService'
import { Alert } from '../@types/prisonApiImport/types'

jest.mock('./prisonService')

describe('Prisoner Alerts Service', () => {
  let prisonService: PrisonService
  let prisonerAlertsService: PrisonerAlertsService

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
    prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
    prisonerAlertsService = new PrisonerAlertsService(prisonService)

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
      offenderNo: 'B1111B',
      active: true,
      expired: false,
      alertCode: 'TECT',
      alertCodeDescription: 'Terrorism Act or Related Offence',
    }

    xcuAlertForMaggie = {
      offenderNo: 'B1111B',
      active: true,
      expired: false,
      alertCode: 'XCU',
      alertCodeDescription: 'Controlled Unlock',
    }

    peepAlertForDave = {
      offenderNo: 'A1111A',
      active: true,
      expired: false,
      alertCode: 'PEEP',
      alertCodeDescription: 'Personal Emergency Evacuation Plan',
    }

    maggieResult = {
      number: prisonerMaggie.number,
      name: prisonerMaggie.name,
      category: prisonerMaggie.category,
      alerts: [
        {
          alertCode: tectAlertForMaggie.alertCode,
        },
        {
          alertCode: xcuAlertForMaggie.alertCode,
        },
      ],
      alertDescriptions: [xcuAlertForMaggie.alertCodeDescription, tectAlertForMaggie.alertCodeDescription],
      hasBadgeAlerts: true,
      hasRelevantCategories: true,
    }

    daveResult = {
      number: prisonerDave.number,
      name: prisonerDave.name,
      category: prisonerDave.category,
      alerts: [
        {
          alertCode: peepAlertForDave.alertCode,
        },
      ],
      alertDescriptions: [peepAlertForDave.alertCodeDescription],
      hasBadgeAlerts: true,
      hasRelevantCategories: true,
    }
  })

  it('should return alerts when all alerts from API are matched', async () => {
    const prisoners = [prisonerDave, prisonerMaggie]

    const expectedOffenderNumbers = prisoners.map(prisoner => prisoner.number)

    const apiResponse = [peepAlertForDave, tectAlertForMaggie, xcuAlertForMaggie] as unknown as Alert[]

    when(prisonService.getPrisonerAlerts)
      .calledWith(atLeast(expectedOffenderNumbers, 'MDI', user))
      .mockResolvedValue(apiResponse)

    const actualResults = await prisonerAlertsService.getAlertDetails(prisoners, 'MDI', user)

    const expectedResults = {
      numPrisonersWithAlerts: 2,
      prisoners: [maggieResult, daveResult],
    }

    expect(actualResults).toEqual(expectedResults)
  })

  it('should return alerts ignoring expired alerts and where category is relevant', async () => {
    const prisoners = [prisonerDave, prisonerMaggie]

    const expectedOffenderNumbers = prisoners.map(prisoner => prisoner.number)

    tectAlertForMaggie.expired = true

    const apiResponse = [peepAlertForDave, tectAlertForMaggie, xcuAlertForMaggie] as unknown as Alert[]

    when(prisonService.getPrisonerAlerts)
      .calledWith(atLeast(expectedOffenderNumbers, 'MDI', user))
      .mockReturnValue(Promise.resolve(apiResponse))

    const actualResults = await prisonerAlertsService.getAlertDetails(prisoners, 'MDI', user)

    maggieResult.alerts = [{ alertCode: xcuAlertForMaggie.alertCode }]
    maggieResult.alertDescriptions = [xcuAlertForMaggie.alertCodeDescription]

    const expectedResults = {
      numPrisonersWithAlerts: 2,
      prisoners: [daveResult, maggieResult],
    }

    expect(actualResults).toEqual(expectedResults)
  })

  it('should return alerts ignoring inactive alerts and where category is relevant', async () => {
    const prisoners = [prisonerDave, prisonerMaggie]

    const expectedOffenderNumbers = prisoners.map(prisoner => prisoner.number)

    tectAlertForMaggie.active = false

    const apiResponse = [peepAlertForDave, tectAlertForMaggie, xcuAlertForMaggie] as unknown as Alert[]

    when(prisonService.getPrisonerAlerts)
      .calledWith(atLeast(expectedOffenderNumbers, 'MDI', user))
      .mockResolvedValue(apiResponse)

    const actualResults = await prisonerAlertsService.getAlertDetails(prisoners, 'MDI', user)

    maggieResult.alerts = [{ alertCode: xcuAlertForMaggie.alertCode }]
    maggieResult.alertDescriptions = [xcuAlertForMaggie.alertCodeDescription]

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
    tectAlertForMaggie.expired = true

    const apiResponse = [peepAlertForDave, tectAlertForMaggie, xcuAlertForMaggie] as unknown as Alert[]

    when(prisonService.getPrisonerAlerts)
      .calledWith(atLeast(expectedOffenderNumbers, 'MDI', user))
      .mockResolvedValue(apiResponse)

    const actualResults = await prisonerAlertsService.getAlertDetails(prisoners, 'MDI', user)

    maggieResult.category = prisonerMaggie.category
    maggieResult.alerts = [{ alertCode: xcuAlertForMaggie.alertCode }]
    maggieResult.alertDescriptions = [xcuAlertForMaggie.alertCodeDescription]
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

    when(prisonService.getPrisonerAlerts)
      .calledWith(atLeast(expectedOffenderNumbers, 'MDI', user))
      .mockResolvedValue(apiResponse)

    const actualResults = await prisonerAlertsService.getAlertDetails(prisoners, 'MDI', user)

    maggieResult.category = prisonerMaggie.category
    maggieResult.alerts = [{ alertCode: tectAlertForMaggie.alertCode }]
    maggieResult.alertDescriptions = [tectAlertForMaggie.alertCodeDescription]
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
    peepAlertForDave.expired = true
    tectAlertForMaggie.active = false

    const apiResponse = [peepAlertForDave, tectAlertForMaggie] as unknown as Alert[]

    when(prisonService.getPrisonerAlerts)
      .calledWith(atLeast(expectedOffenderNumbers, 'MDI', user))
      .mockResolvedValue(apiResponse)

    const actualResults = await prisonerAlertsService.getAlertDetails(prisoners, 'MDI', user)

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
      offenderNo: 'E1111E',
      active: true,
      expired: false,
      alertCode: 'OCG',
      alertCodeDescription: 'OCG Nominal',
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
          alertCode: ocgAlertForAlice.alertCode,
        },
      ],
      alertDescriptions: [ocgAlertForAlice.alertCodeDescription],
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

    when(prisonService.getPrisonerAlerts)
      .calledWith(atLeast(expectedOffenderNumbers, 'MDI', user))
      .mockResolvedValue(apiResponse)

    const actualResults = await prisonerAlertsService.getAlertDetails(prisoners, 'MDI', user)

    const expectedResults = {
      numPrisonersWithAlerts: 3,
      prisoners: [maggieResult, daveResult, aliceResult, alanResult],
    }

    expect(actualResults).toEqual(expectedResults)
  })
})
