import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import PrisonService from '../../../../../services/prisonService'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import ActivitiesService from '../../../../../services/activitiesService'
import {
  Activity,
  ActivityCategory,
  ActivitySchedule,
  ActivitySummary,
  Allocation,
  PrisonerAllocations,
} from '../../../../../@types/activitiesAPI/types'
import NonAssociationsService from '../../../../../services/nonAssociationsService'
import FromActivityListRoutes, { FromActivityList } from './fromActivityList'
import activitySchedule from '../../../../../services/fixtures/activity_schedule_1.json'

jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/nonAssociationsService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const nonAssociationsService = new NonAssociationsService(null, null) as jest.Mocked<NonAssociationsService>

const educationCategory: ActivityCategory = {
  code: '',
  id: 1,
  name: 'Education',
}

const gymCategory: ActivityCategory = {
  code: '',
  id: 2,
  name: 'Gym, sport, fitness',
}

const maths: ActivitySummary = {
  allocated: 0,
  capacity: 0,
  createdTime: '',
  waitlisted: 0,
  id: 1,
  activityName: 'Maths level 1',
  activityState: 'LIVE',
  category: educationCategory,
}

const english: ActivitySummary = {
  allocated: 0,
  capacity: 0,
  createdTime: '',
  waitlisted: 0,
  id: 2,
  activityName: 'English level 1',
  activityState: 'LIVE',
  category: educationCategory,
}

const gym: ActivitySummary = {
  allocated: 0,
  capacity: 0,
  createdTime: '',
  waitlisted: 0,
  id: 3,
  activityName: 'Gym',
  activityState: 'ARCHIVED',
  category: gymCategory,
}

const mockActivity: Activity = {
  attendanceRequired: false,
  category: { code: '', id: 0, name: '' },
  createdBy: '',
  createdTime: '',
  eligibilityRules: [],
  id: 1,
  inCell: false,
  minimumEducationLevel: [],
  offWing: false,
  onWing: false,
  outsideWork: false,
  paid: false,
  pay: [],
  payPerSession: undefined,
  pieceWork: false,
  prisonCode: '',
  riskLevel: '',
  schedules: [activitySchedule as unknown as ActivitySchedule],
  startDate: '',
  summary: '',
}

const prisonerA: Prisoner = {
  dateOfBirth: '',
  ethnicity: '',
  firstName: 'TEST01',
  gender: '',
  lastName: 'PRISONER01',
  maritalStatus: '',
  mostSeriousOffence: '',
  nationality: '',
  prisonerNumber: 'A1234BC',
  religion: '',
  restrictedPatient: false,
  status: 'ACTIVE IN',
  youthOffender: false,
  prisonId: 'TPR',
  cellLocation: '1-1-1',
  currentIncentive: {
    level: {
      description: 'Standard',
    },
    dateTime: '2022-11-10T15:47:24',
    nextReviewDate: '2022-11-10',
  },
}

const prisonerB: Prisoner = {
  dateOfBirth: '',
  ethnicity: '',
  firstName: 'TEST02',
  gender: '',
  lastName: 'PRISONER02',
  maritalStatus: '',
  mostSeriousOffence: '',
  nationality: '',
  prisonerNumber: 'B2345CD',
  religion: '',
  restrictedPatient: false,
  status: 'ACTIVE IN',
  youthOffender: false,
  prisonId: 'TPR',
  cellLocation: '2-2-2',
  currentIncentive: {
    level: {
      description: 'Basic',
    },
    dateTime: '2022-11-10T15:47:24',
    nextReviewDate: '2022-11-10',
  },
}

const allocation: Allocation = {
  activityId: 22,
  activitySummary: 'other',
  bookingId: 0,
  exclusions: [],
  id: 0,
  isUnemployment: false,
  prisonerNumber: 'A1234BC',
  scheduleDescription: '',
  scheduleId: 22,
  startDate: '2024-01-01',
  status: undefined,
}

const prisonerAllocations1: PrisonerAllocations = {
  allocations: [allocation],
  prisonerNumber: 'A1234BC',
}

const prisonerAllocations2: PrisonerAllocations = {
  allocations: [],
  prisonerNumber: 'B2345CD',
}

const prisonersResult = [
  { prisonerNumber: 'A1234BC', firstName: 'Daphne', lastName: 'Doe', cellLocation: '1-1-1' },
  { prisonerNumber: 'B2345CD', firstName: 'Ted', lastName: 'Daphneson', cellLocation: '2-2-2' },
] as Prisoner[]

describe('Allocate multiple people to an activity - upload a prisoner list', () => {
  const handler = new FromActivityListRoutes(prisonService, activitiesService, nonAssociationsService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: 'TPR',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        allocateJourney: {
          inmates: [],
          activity: {
            scheduleId: 1,
          },
        },
      },
      query: {},
    } as unknown as Request
  })
  describe('GET', () => {
    it('should render the from activity list view', async () => {
      when(activitiesService.getActivities).calledWith(true, res.locals.user).mockResolvedValue([maths, english, gym])

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/fromActivityList',
        {
          activities: [maths, english, gym],
        },
      )
    })
  })

  // FiXME implement post tests
  describe('POST', () => {
    it('should redirect to review upload a prisoner list view', async () => {
      when(activitiesService.getActivity).calledWith(1, res.locals.user).mockResolvedValue(mockActivity)

      when(activitiesService.getAllocationsWithParams)
        .calledWith(1, { activeOnly: true }, res.locals.user)
        .mockResolvedValue([])

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([prisonerA, prisonerB])

      when(prisonService.searchPrisonInmates)
        .calledWith('', res.locals.user)
        .mockResolvedValue({ content: prisonersResult })

      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([prisonerAllocations1, prisonerAllocations2])

      when(nonAssociationsService.getListPrisonersWithNonAssociations)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue(['A1234BC'])

      req.body = {
        activityId: '1',
      }

      await handler.POST(req, res)

      // const expectedInmates: Inmate[] = [
      //   {
      //     prisonerName: 'TEST01 PRISONER01',
      //     firstName: 'TEST01',
      //     lastName: 'PRISONER01',
      //     prisonerNumber: 'A1234BC',
      //     prisonCode: 'TPR',
      //     status: 'ACTIVE IN',
      //     cellLocation: '1-1-1',
      //     incentiveLevel: 'Standard',
      //     payBand: undefined,
      //     otherAllocations: [
      //       {
      //         activityId: 22,
      //         activitySummary: 'other',
      //         bookingId: 0,
      //         exclusions: [],
      //         id: 0,
      //         isUnemployment: false,
      //         prisonerNumber: 'A1234BC',
      //         scheduleDescription: '',
      //         scheduleId: 22,
      //         startDate: '2024-01-01',
      //         status: undefined,
      //       },
      //     ],
      //     nonAssociations: true,
      //   },
      //   {
      //     prisonerName: 'TEST02 PRISONER02',
      //     firstName: 'TEST02',
      //     lastName: 'PRISONER02',
      //     prisonerNumber: 'B2345CD',
      //     prisonCode: 'TPR',
      //     status: 'ACTIVE IN',
      //     cellLocation: '2-2-2',
      //     incentiveLevel: 'Basic',
      //     payBand: undefined,
      //     otherAllocations: [],
      //     nonAssociations: false,
      //   },
      // ]

      // expect(req.session.allocateJourney.inmates).toEqual(expectedInmates)
      // expect(res.redirect).toHaveBeenCalledWith('review-upload-prisoner-list')
    })

    it('should fail to validate if there are no allocations for the activity to copy', async () => {
      when(activitiesService.getActivity).calledWith(1, res.locals.user).mockResolvedValue(mockActivity)

      when(activitiesService.getAllocationsWithParams)
        .calledWith(1, { activeOnly: true }, res.locals.user)
        .mockResolvedValue([])

      // only one returned
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['A1234BC', 'B2345CD'], res.locals.user)
        .mockResolvedValue([prisonerA])

      when(prisonService.searchPrisonInmates)
        .calledWith('', res.locals.user)
        .mockResolvedValue({ content: prisonersResult })

      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(['A1234BC'], res.locals.user)
        .mockResolvedValue([prisonerAllocations1])

      when(nonAssociationsService.getListPrisonersWithNonAssociations)
        .calledWith(['A1234BC'], res.locals.user)
        .mockResolvedValue(['A1234BC'])

      req.body = {
        activityId: '1',
      }

      await handler.POST(req, res)

      // expect(res.validationFailed).toHaveBeenCalledWith(
      //   'file',
      //   'The following prison number does not match anyone in this prison: B2345CD',
      // )
    })
  })

  describe('Validation', () => {
    it('validation fails when no activity is selected', async () => {
      const body = {}

      const requestObject = plainToInstance(FromActivityList, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'activityId', error: 'You must select an activity' }]))
    })
  })
})
