import { when } from 'jest-when'
import { addDays } from 'date-fns'
import atLeast from '../../jest.setup'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import WhereaboutsApiClient from '../data/whereaboutsApiClient'
import PrisonService from './prisonService'
import { Education, InmateDetail, ReferenceCode } from '../@types/prisonApiImport/types'
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
import { LocationLenient } from '../@types/prisonApiImportCustom'
import { toDateString } from '../utils/utils'

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
      const apiResponse = [
        { id: 1, active: false },
        { id: 2, active: true, sequence: 1 },
        { id: 3, active: true, sequence: 0 },
      ] as unknown as IepLevel[]

      when(incentivesApiClient.getIncentiveLevels).calledWith(atLeast('MDI')).mockResolvedValue(apiResponse)

      const actualResult = await prisonService.getIncentiveLevels('MDI', user)

      expect(actualResult).toEqual([
        { id: 3, active: true, sequence: 0 },
        { id: 2, active: true, sequence: 1 },
      ])
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

  describe('getEventLocations', () => {
    it('should get the prisons event locations from the prisons API', async () => {
      const expectedResult = [{ data: 'response' }] as unknown as LocationLenient[]

      when(prisonApiClient.getEventLocations).calledWith(atLeast('MDI')).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getEventLocations('MDI', user)

      expect(actualResult).toEqual(expectedResult)
      expect(prisonApiClient.getEventLocations).toHaveBeenCalledWith('MDI', user)
    })
  })

  describe('getLocationsForAppointments', () => {
    it('should get the prisons event locations from the prisons API', async () => {
      const expectedResult = [{ data: 'response' }] as unknown as LocationLenient[]

      when(prisonApiClient.getLocationsForEventType).calledWith(atLeast('MDI', 'APP')).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getLocationsForAppointments('MDI', user)

      expect(actualResult).toEqual(expectedResult)
      expect(prisonApiClient.getLocationsForEventType).toHaveBeenCalledWith('MDI', 'APP', user)
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

  describe('getReferenceCodes', () => {
    it('should get the reference codes for the supplied domain from the prisons API', async () => {
      const expectedResult = [{ data: 'response' }] as unknown as ReferenceCode[]

      when(prisonApiClient.getReferenceCodes).calledWith(atLeast('EDU_LEVEL')).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getReferenceCodes('EDU_LEVEL', user)

      expect(actualResult).toEqual(expectedResult)
      expect(prisonApiClient.getReferenceCodes).toHaveBeenCalledWith('EDU_LEVEL', user)
    })
  })

  describe('getEducations', () => {
    it('should get education levels for a prisoner from prison API', async () => {
      const expectedResult = [
        { studyArea: 'Mathematics', educationLevel: 'Level 1', endDate: '2022-01-01' },
      ] as unknown as Education[]

      when(prisonApiClient.getEducations)
        .calledWith(atLeast(['ABC123']))
        .mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getEducations('ABC123', user)

      expect(actualResult).toEqual(expectedResult)
    })

    it('should get education levels for a list of prisoners from prison API', async () => {
      const expectedResult = [
        { studyArea: 'Mathematics', educationLevel: 'Level 1', endDate: '2022-01-01' },
      ] as unknown as Education[]

      when(prisonApiClient.getEducations)
        .calledWith(atLeast(['ABC123', 'CBA321']))
        .mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getEducations(['ABC123', 'CBA321'], user)

      expect(actualResult).toEqual(expectedResult)
    })

    it('should filter out any results without an end date', async () => {
      const response = [{ studyArea: 'Mathematics', educationLevel: 'Level 1' }] as unknown as Education[]

      prisonApiClient.getEducations = jest.fn()
      when(prisonApiClient.getEducations)
        .calledWith(atLeast(['ABC123']))
        .mockResolvedValue(response)

      const actualResult = await prisonService.getEducations('ABC123', user)

      expect(actualResult).toEqual([])
    })

    it('should filter out any results with an end date after now', async () => {
      const response = [
        { studyArea: 'Mathematics', educationLevel: 'Level 1', endDate: toDateString(addDays(new Date(), 1)) },
      ] as unknown as Education[]

      prisonApiClient.getEducations = jest.fn()
      when(prisonApiClient.getEducations)
        .calledWith(atLeast(['ABC123']))
        .mockResolvedValue(response)

      const actualResult = await prisonService.getEducations('ABC123', user)

      expect(actualResult).toEqual([])
    })

    it('should not filter out any results with an end date after now when inflight certifications are included', async () => {
      const tomorrowAsString = toDateString(addDays(new Date(), 1))
      const response = [
        { studyArea: 'Mathematics', educationLevel: 'Level 1', endDate: tomorrowAsString },
      ] as unknown as Education[]

      prisonApiClient.getEducations = jest.fn()
      when(prisonApiClient.getEducations)
        .calledWith(atLeast(['ABC123']))
        .mockResolvedValue(response)

      const actualResult = await prisonService.getEducations('ABC123', user, false)

      expect(actualResult).toEqual([
        {
          educationLevel: 'Level 1',
          endDate: tomorrowAsString,
          studyArea: 'Mathematics',
        },
      ])
    })

    it('should not filter out any duplicate certifications when filter duplicates flag is false', async () => {
      const response = [
        {
          bookingId: 1,
          studyArea: 'Mathematics',
          educationLevel: 'Level 1',
          endDate: '2022-01-01',
        },
        {
          bookingId: 1,
          studyArea: 'Mathematics',
          educationLevel: 'Level 1',
          endDate: '2021-01-01',
        },
        {
          bookingId: 2,
          studyArea: 'Mathematics',
          educationLevel: 'Level 1',
          endDate: '2021-01-01',
        },
        {
          bookingId: 2,
          studyArea: 'Mathematics',
          educationLevel: 'Level 2',
          endDate: '2021-01-01',
        },
        {
          bookingId: 2,
          studyArea: 'English',
          educationLevel: 'Level 2',
          endDate: '2021-01-01',
        },
      ] as unknown as Education[]

      prisonApiClient.getEducations = jest.fn()
      when(prisonApiClient.getEducations)
        .calledWith(atLeast(['ABC123']))
        .mockResolvedValue(response)

      const actualResult = await prisonService.getEducations('ABC123', user, true, false)

      expect(actualResult).toEqual(response)
    })
  })
})
