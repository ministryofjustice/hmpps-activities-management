import { Request, Response } from 'express'
import { when } from 'jest-when'
import { addDays } from 'date-fns'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import NonAssociationsService from '../../../../../services/nonAssociationsService'
import SelectPrisonerRoutes from './selectPrisoner'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import atLeast from '../../../../../../jest.setup'
import { Activity, Allocation, PrisonerAllocations } from '../../../../../@types/activitiesAPI/types'
import activitySchedule from '../../../../../services/fixtures/activity_schedule_1.json'
import { toDateString } from '../../../../../utils/utils'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/nonAssociationsService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const nonAssociationsService = new NonAssociationsService(null, null) as jest.Mocked<NonAssociationsService>

describe('Select prisoner - alllocate multiple people to an activity', () => {
  const handler = new SelectPrisonerRoutes(prisonService, activitiesService, nonAssociationsService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      validationFailed: jest.fn(),
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: 'MDI',
        },
      },
    } as unknown as Response

    req = {
      session: {
        allocateJourney: {
          inmates: [],
          activity: {
            activityId: 100,
            scheduleId: 100,
            name: 'Activity 100',
            location: 'A-WING',
            inCell: false,
            onWing: false,
            offWing: true,
            startDate: '01-01-2025',
            endDate: null,
            scheduleWeeks: 1,
            paid: true,
          },
        },
      },
      query: {},
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    it('should render the view (nothing searched for yet)', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/selectPrisoner',
        { preserveHistory: undefined },
      )
    })
    it('should render the view with search term', async () => {
      req.query = {
        query: 'Daphne',
      }

      const prisonersResult = [
        { prisonerNumber: 'G9566GQ', firstName: 'Daphne', lastName: 'Doe', middleNames: '', cellLocation: '1-1-1' },
        { prisonerNumber: 'T4530VC', firstName: 'Ted', lastName: 'Daphneson', middleNames: '', cellLocation: '2-2-2' },
      ] as Prisoner[]

      const prisonerAllocations = [
        {
          prisonerNumber: 'G9566GQ',
          allocations: [
            { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
            { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
          ],
        },
        {
          prisonerNumber: 'T4530VC',
          allocations: [
            { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
            { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
          ],
        },
      ] as PrisonerAllocations[]

      when(prisonService.searchPrisonInmates)
        .calledWith('Daphne', res.locals.user)
        .mockResolvedValue({ content: prisonersResult })

      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(['G9566GQ', 'T4530VC'], res.locals.user)
        .mockResolvedValue(prisonerAllocations)

      when(nonAssociationsService.getListPrisonersWithNonAssociations)
        .calledWith(['G9566GQ', 'T4530VC'], res.locals.user)
        .mockResolvedValue(['G9566GQ', 'H4623WP'])
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/selectPrisoner',
        {
          query: 'Daphne',
          prisoners: [
            {
              prisonerNumber: 'G9566GQ',
              prisonerName: 'Daphne Doe',
              firstName: 'Daphne',
              middleNames: '',
              lastName: 'Doe',
              status: undefined,
              prisonCode: undefined,
              payBand: undefined,
              cellLocation: '1-1-1',
              incentiveLevel: undefined,
              otherAllocations: [
                { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
                { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
              ],
              nonAssociations: true,
            },
            {
              prisonerNumber: 'T4530VC',
              prisonerName: 'Ted Daphneson',
              status: undefined,
              prisonCode: undefined,
              payBand: undefined,
              firstName: 'Ted',
              middleNames: '',
              lastName: 'Daphneson',
              cellLocation: '2-2-2',
              incentiveLevel: undefined,
              otherAllocations: [
                { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
                { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
              ],
              nonAssociations: false,
            },
          ],
        },
      )
    })
  })
  describe('SEARCH', () => {
    it('should redirect with query string', async () => {
      req.body = {
        query: 'scooby',
      }

      await handler.SEARCH(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`select-prisoner?query=scooby`)
    })
  })
  describe('SELECT_PRISONER', () => {
    it("should add inmates to the session if they're not already allocated and the activity is unpaid", async () => {
      req.body = {
        selectedPrisoner: 'G9566GQ',
      }
      const prisonerInfo = {
        prisonerNumber: 'G9566GQ',
        firstName: 'Daphne',
        middleNames: 'Frances',
        prisonCode: 'MDI',
        status: undefined,
        prisonId: 'MDI',
        lastName: 'Doe',
        cellLocation: '1-1-1',
        currentIncentive: {
          level: {
            description: 'Standard',
          },
        },
      } as unknown as Prisoner
      const activity = {
        category: { code: 'EDUCATION', id: 1, name: 'Education' },
        endDate: toDateString(addDays(new Date(), 7)),
        inCell: false,
        pay: [],
        paid: false,
        schedules: [activitySchedule],
        startDate: toDateString(new Date()),
        summary: 'Maths Level 1',
        id: 1,
      } as unknown as Activity
      const prisonerAllocations = [
        {
          prisonerNumber: 'G9566GQ',
          allocations: [],
        },
      ] as PrisonerAllocations[]

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('G9566GQ', res.locals.user)
        .mockResolvedValueOnce(prisonerInfo)
      when(activitiesService.getAllocationsWithParams).calledWith(atLeast(100)).mockResolvedValueOnce([])
      when(activitiesService.getActivity).calledWith(atLeast(100)).mockResolvedValueOnce(activity)
      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(['G9566GQ'], res.locals.user)
        .mockResolvedValue(prisonerAllocations)
      when(nonAssociationsService.getListPrisonersWithNonAssociations)
        .calledWith(['G9566GQ'], res.locals.user)
        .mockResolvedValue(['G9566GQ', 'H4623WP'])
      await handler.SELECT_PRISONER(req, res)
      expect(req.session.allocateJourney.inmates).toEqual([
        {
          prisonerName: `Daphne Doe`,
          firstName: 'Daphne',
          middleNames: 'Frances',
          lastName: 'Doe',
          prisonerNumber: 'G9566GQ',
          prisonCode: 'MDI',
          status: undefined,
          cellLocation: '1-1-1',
          incentiveLevel: 'Standard',
          payBand: undefined,
          nonAssociations: true,
          otherAllocations: [],
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-search-prisoner-list')
    })
    it('should add inmate to the session if they meet requirements', async () => {
      req.body = {
        selectedPrisoner: 'G9566GQ',
      }

      const prisonerInfo = {
        prisonerNumber: 'G9566GQ',
        firstName: 'Daphne',
        middleNames: 'Frances',
        prisonCode: 'MDI',
        status: undefined,
        prisonId: 'MDI',
        lastName: 'Doe',
        cellLocation: '1-1-1',
        currentIncentive: {
          level: {
            description: 'Standard',
          },
        },
      } as unknown as Prisoner
      const activityAllocations = [
        {
          id: 1,
          prisonerNumber: 'GX123VU',
          allocatedTime: '2023-02-17T15:22:00',
          startDate: '2023-02-17',
          prisonerName: 'Scooby Doo',
          prisonerFirstName: 'Scooby',
          prisonerLastName: 'Doo',
          cellLocation: '1-1-1',
          earliestReleaseDate: { releaseDate: '2026-12-25' },
          isUnemployment: false,
          plannedSuspension: { plannedStartDate: '2025-04-20' },
        },
      ] as Allocation[]
      const activity = {
        category: { code: 'EDUCATION', id: 1, name: 'Education' },
        endDate: toDateString(addDays(new Date(), 7)),
        inCell: false,
        pay: [{ incentiveLevel: 'Standard' }],
        schedules: [activitySchedule],
        startDate: toDateString(new Date()),
        summary: 'Maths Level 1',
        id: 1,
        paid: true,
      } as unknown as Activity
      const prisonerAllocations = [
        {
          prisonerNumber: 'G9566GQ',
          allocations: [
            { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
            { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
          ],
        },
      ] as PrisonerAllocations[]

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('G9566GQ', res.locals.user)
        .mockResolvedValueOnce(prisonerInfo)
      when(activitiesService.getAllocationsWithParams)
        .calledWith(atLeast(100))
        .mockResolvedValueOnce(activityAllocations)
      when(activitiesService.getActivity).calledWith(atLeast(100)).mockResolvedValueOnce(activity)

      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(['G9566GQ'], res.locals.user)
        .mockResolvedValue(prisonerAllocations)
      when(nonAssociationsService.getListPrisonersWithNonAssociations)
        .calledWith(['G9566GQ'], res.locals.user)
        .mockResolvedValue(['G9566GQ', 'H4623WP'])
      await handler.SELECT_PRISONER(req, res)
      expect(req.session.allocateJourney.inmates).toEqual([
        {
          prisonerName: `Daphne Doe`,
          firstName: 'Daphne',
          middleNames: 'Frances',
          lastName: 'Doe',
          prisonerNumber: 'G9566GQ',
          prisonCode: 'MDI',
          status: undefined,
          cellLocation: '1-1-1',
          incentiveLevel: 'Standard',
          payBand: undefined,
          nonAssociations: true,
          otherAllocations: [
            { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
            { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
          ],
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('review-search-prisoner-list')
    })
    it('should throw error if the inmate is already allocated', async () => {
      req.body = {
        selectedPrisoner: 'G9566GQ',
      }

      const prisonerInfo = {
        prisonerNumber: 'G9566GQ',
        firstName: 'Daphne',
        middleNames: 'Frances',
        prisonCode: 'MDI',
        status: undefined,
        prisonId: 'MDI',
        lastName: 'Doe',
        cellLocation: '1-1-1',
        currentIncentive: {
          level: {
            description: 'Standard',
          },
        },
      } as unknown as Prisoner
      const activityAllocations2 = [
        {
          id: 1,
          prisonerNumber: 'G9566GQ',
          allocatedTime: '2023-02-17T15:22:00',
          startDate: '2023-02-17',
          prisonerName: 'Daphne Doe',
          prisonerFirstName: 'Daphne',
          prisonerLastName: 'Doe',
          cellLocation: '1-1-1',
          earliestReleaseDate: { releaseDate: '2026-12-25' },
          isUnemployment: false,
          plannedSuspension: { plannedStartDate: '2025-04-20' },
        },
      ] as Allocation[]
      const activity = {
        category: { code: 'EDUCATION', id: 1, name: 'Education' },
        endDate: toDateString(addDays(new Date(), 7)),
        inCell: false,
        pay: [{ incentiveLevel: 'Standard' }],
        schedules: [activitySchedule],
        startDate: toDateString(new Date()),
        summary: 'Maths Level 1',
        id: 1,
        paid: true,
      } as unknown as Activity

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('G9566GQ', res.locals.user)
        .mockResolvedValueOnce(prisonerInfo)
      when(activitiesService.getAllocationsWithParams)
        .calledWith(atLeast(100))
        .mockResolvedValueOnce(activityAllocations2)
      when(activitiesService.getActivity).calledWith(atLeast(100)).mockResolvedValueOnce(activity)
      await handler.SELECT_PRISONER(req, res)
      expect(res.validationFailed).toHaveBeenCalledWith(
        'selectedPrisoner',
        `This person is already allocated to Activity 100`,
      )
    })

    it('should throw error if the inmate has an innapropriate incentive level for the activity', async () => {
      req.body = {
        selectedPrisoner: 'G9566GQ',
      }

      const prisonerInfo = {
        prisonerNumber: 'G9566GQ',
        firstName: 'Daphne',
        middleNames: 'Frances',
        prisonCode: 'MDI',
        status: undefined,
        prisonId: 'MDI',
        lastName: 'Doe',
        cellLocation: '1-1-1',
        currentIncentive: {
          level: {
            description: 'Standard',
          },
        },
      } as unknown as Prisoner
      const activityAllocations = [
        {
          id: 1,
          prisonerNumber: 'GX123VU',
          allocatedTime: '2023-02-17T15:22:00',
          startDate: '2023-02-17',
          prisonerName: 'Scooby Doo',
          prisonerFirstName: 'Scooby',
          prisonerLastName: 'Doo',
          cellLocation: '1-1-1',
          earliestReleaseDate: { releaseDate: '2026-12-25' },
          isUnemployment: false,
          plannedSuspension: { plannedStartDate: '2025-04-20' },
        },
      ] as Allocation[]
      const activity = {
        category: { code: 'EDUCATION', id: 1, name: 'Education' },
        endDate: toDateString(addDays(new Date(), 7)),
        inCell: false,
        pay: [{ incentiveLevel: 'Basic' }],
        schedules: [activitySchedule],
        startDate: toDateString(new Date()),
        summary: 'Maths Level 1',
        id: 1,
        paid: true,
      } as unknown as Activity

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('G9566GQ', res.locals.user)
        .mockResolvedValue(prisonerInfo)
      when(activitiesService.getAllocationsWithParams)
        .calledWith(atLeast(100))
        .mockResolvedValueOnce(activityAllocations)
      when(activitiesService.getActivity).calledWith(atLeast(100)).mockResolvedValue(activity)
      await handler.SELECT_PRISONER(req, res)
      expect(res.validationFailed).toHaveBeenCalledWith(
        'selectedPrisoner',
        `This person cannot be allocated as there is no pay rate for their incentive level`,
      )
    })
  })
})
