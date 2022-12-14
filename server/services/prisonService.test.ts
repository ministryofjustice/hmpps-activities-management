import { when } from 'jest-when'
import atLeast from '../../jest.setup'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import WhereaboutsApiClient from '../data/whereaboutsApiClient'
import PrisonService from './prisonService'
import { InmateDetail } from '../@types/prisonApiImport/types'
import { Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'
import activityLocations from './fixtures/activity_locations_1.json'
import activitiesAtLocation from './fixtures/activities_at_location_1.json'
import sentenceData from './fixtures/sentence_data_1.json'
import alerts from './fixtures/alerts_1.json'
import assessments from './fixtures/assessments_1.json'
import activities from './fixtures/activities_1.json'
import absenceReasons from './fixtures/absence-reasons_1.json'
import batchUpdateAttendanceResponse from './fixtures/batch_update_attendance_response_1.json'
import { OffenderActivityId } from '../@types/dps'
import IncentivesApiClient from '../data/incentivesApiClient'
import { IepLevel } from '../@types/incentivesApi/types'

jest.mock('../data/prisonApiClient')
jest.mock('../data/prisonerSearchApiClient')
jest.mock('../data/whereaboutsApiClient')
jest.mock('../data/incentivesApiClient')

describe('Prison Service', () => {
  const prisonApiClient = new PrisonApiClient()
  const prisonerSearchApiClient = new PrisonerSearchApiClient()
  const whereaboutsApiClient = new WhereaboutsApiClient()
  const incentivesApiClient = new IncentivesApiClient()
  const prisonService = new PrisonService(
    prisonApiClient,
    prisonerSearchApiClient,
    whereaboutsApiClient,
    incentivesApiClient,
  )

  const user = {} as ServiceUser

  describe('getInmate', () => {
    it('should get inmate detail from prison API', async () => {
      const expectedResult = { data: 'response' } as unknown as InmateDetail

      when(prisonApiClient.getInmateDetail).calledWith(atLeast('ABC123')).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getInmate('ABC123', user)

      expect(actualResult).toEqual(expectedResult)
      expect(prisonApiClient.getInmateDetail).toHaveBeenCalledWith('ABC123', user)
    })
  })

  describe('getIncentiveLevels', () => {
    it('should get the prisons incentive levels from incentives API', async () => {
      const expectedResult = [{ data: 'response' }] as unknown as IepLevel[]

      when(incentivesApiClient.getIncentiveLevels).calledWith(atLeast('MDI')).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getIncentiveLevels('MDI', user)

      expect(actualResult).toEqual(expectedResult)
      expect(incentivesApiClient.getIncentiveLevels).toHaveBeenCalledWith('MDI', user)
    })
  })

  describe('searchInmates', () => {
    it('should search inmates using prisoner search API', async () => {
      const searchCriteria = { lastName: 'Smith' } as PrisonerSearchCriteria
      const expectedResult = [{ data: 'response' }] as unknown as Prisoner[]

      when(prisonerSearchApiClient.searchInmates).calledWith(atLeast(searchCriteria)).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.searchInmates(searchCriteria, user)

      expect(actualResult).toEqual(expectedResult)
      expect(prisonerSearchApiClient.searchInmates).toHaveBeenCalledWith(searchCriteria, user)
    })
  })

  describe('searchActivityLocations', () => {
    it('should search activity locations using prisoner search API', async () => {
      when(prisonApiClient.searchActivityLocations).calledWith(atLeast('10001')).mockResolvedValue(activityLocations)
      const locations = await prisonService.searchActivityLocations('EDI', '10001', '2022-08-01', user)
      expect(locations.length).toEqual(3)
      expect(prisonApiClient.searchActivityLocations).toHaveBeenCalledWith('EDI', '10001', '2022-08-01', user)
    })
  })

  describe('searchActivities', () => {
    it('should search activity locations using prisoner search API', async () => {
      when(prisonApiClient.getActivitiesAtLocation)
        .calledWith(atLeast('10001'))
        .mockResolvedValueOnce(activitiesAtLocation)
      when(prisonApiClient.getActivityList).calledWith(atLeast('10001')).mockResolvedValueOnce([])
      when(prisonApiClient.getActivityList).calledWith(atLeast('10001')).mockResolvedValueOnce([])
      when(whereaboutsApiClient.getAttendance).calledWith(atLeast('10001')).mockResolvedValueOnce({})
      when(prisonApiClient.getSentenceData)
        .calledWith(atLeast(['G8785VP', 'G3439UH']))
        .mockResolvedValueOnce(sentenceData)
      when(prisonApiClient.getCourtEvents)
        .calledWith(atLeast(['G8785VP', 'G3439UH']))
        .mockResolvedValueOnce([])
      when(prisonApiClient.getExternalTransfers)
        .calledWith(atLeast(['G8785VP', 'G3439UH']))
        .mockResolvedValueOnce([])
      when(prisonApiClient.getAlerts)
        .calledWith(atLeast(['G8785VP', 'G3439UH']))
        .mockResolvedValueOnce(alerts)
      when(prisonApiClient.getAssessments)
        .calledWith(atLeast(['G8785VP', 'G3439UH']))
        .mockResolvedValueOnce(assessments)
      when(prisonApiClient.getVisits)
        .calledWith(atLeast(['G8785VP', 'G3439UH']))
        .mockResolvedValueOnce([])
      when(prisonApiClient.getAppointments)
        .calledWith(atLeast(['G8785VP', 'G3439UH']))
        .mockResolvedValueOnce([])
      when(prisonApiClient.getActivities)
        .calledWith(atLeast(['G8785VP', 'G3439UH']))
        .mockResolvedValueOnce(activities)

      const results = await prisonService.searchActivities('MDI', '10001', '2022-08-01', 'AM', user)

      expect(results.length).toEqual(2)
      expect(prisonApiClient.getActivitiesAtLocation).toHaveBeenCalledWith('10001', '2022-08-01', 'AM', true, user)
      expect(prisonApiClient.getActivityList).toHaveBeenCalledWith('MDI', '10001', '2022-08-01', 'AM', 'VISIT', user)
      expect(prisonApiClient.getActivityList).toHaveBeenCalledWith('MDI', '10001', '2022-08-01', 'AM', 'APP', user)
      expect(whereaboutsApiClient.getAttendance).toHaveBeenCalledWith('MDI', '10001', '2022-08-01', 'AM', user)
      expect(prisonApiClient.getSentenceData).toHaveBeenCalledWith(['G8785VP', 'G3439UH'], user)
      expect(prisonApiClient.getCourtEvents).toHaveBeenCalledWith('MDI', '2022-08-01', ['G8785VP', 'G3439UH'], user)
      expect(prisonApiClient.getExternalTransfers).toHaveBeenCalledWith(
        'MDI',
        '2022-08-01',
        ['G8785VP', 'G3439UH'],
        user,
      )
      expect(prisonApiClient.getAlerts).toHaveBeenCalledWith('MDI', ['G8785VP', 'G3439UH'], user)
      expect(prisonApiClient.getAssessments).toHaveBeenCalledWith('CATEGORY', ['G8785VP', 'G3439UH'], user)
      expect(prisonApiClient.getVisits).toHaveBeenCalledWith('MDI', '2022-08-01', 'AM', ['G8785VP', 'G3439UH'], user)
      expect(prisonApiClient.getAppointments).toHaveBeenCalledWith(
        'MDI',
        '2022-08-01',
        'AM',
        ['G8785VP', 'G3439UH'],
        user,
      )
      expect(prisonApiClient.getActivities).toHaveBeenCalledWith(
        'MDI',
        '2022-08-01',
        'AM',
        ['G8785VP', 'G3439UH'],
        user,
      )
    })
  })

  describe('getAbsenceReasons', () => {
    it('should fetch absence reasons using whereabouts API', async () => {
      when(whereaboutsApiClient.getAbsenceReasons).mockResolvedValue(absenceReasons)
      const reasons = await prisonService.getAbsenceReasons(user)
      expect(reasons.paidReasons.length).toEqual(3)
      expect(whereaboutsApiClient.getAbsenceReasons).toHaveBeenCalledWith(user)
    })
  })

  describe('batchUpdateAttendance', () => {
    it('should batch update attendance using whereabouts API', async () => {
      const activityIds: OffenderActivityId[] = [
        {
          bookingId: 1,
          activityId: 2,
        },
        {
          bookingId: 2,
          activityId: 2,
        },
      ]

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      when(whereaboutsApiClient.batchUpdateAttendance).mockResolvedValue(batchUpdateAttendanceResponse)
      const reasons = await prisonService.batchUpdateAttendance(
        'MDI',
        '10001G',
        '2022-08-01',
        'AM',
        activityIds,
        true,
        true,
        'reason',
        'comments',
        user,
      )
      expect(reasons.attendances.length).toEqual(2)
      expect(whereaboutsApiClient.getAbsenceReasons).toHaveBeenCalledWith(user)
    })
  })
})
