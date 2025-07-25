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
import { Inmate } from '../../journey'

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
  payChange: [],
  payPerSession: undefined,
  pieceWork: false,
  prisonCode: '',
  riskLevel: '',
  schedules: [activitySchedule as unknown as ActivitySchedule],
  startDate: '',
  summary: 'Writing',
  description: 'Writing',
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
  prisonerNumber: 'G4793VF',
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
  prisonerNumber: 'A9477DY',
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

const prisonerC: Prisoner = {
  dateOfBirth: '',
  ethnicity: '',
  firstName: 'TEST02',
  gender: '',
  lastName: 'PRISONER02',
  maritalStatus: '',
  mostSeriousOffence: '',
  nationality: '',
  prisonerNumber: 'A5193DY',
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
  status: 'ACTIVE',
}

const prisonerAllocations1: PrisonerAllocations = {
  allocations: [allocation],
  prisonerNumber: 'G4793VF',
}

const prisonerAllocations2: PrisonerAllocations = {
  allocations: [],
  prisonerNumber: 'A9477DY',
}

const prisonerAllocations3: PrisonerAllocations = {
  allocations: [],
  prisonerNumber: 'A5193DY',
}

const prisonersResult = [
  { prisonerNumber: 'G4793VF', firstName: 'Daphne', lastName: 'Doe', cellLocation: '1-1-1' },
  { prisonerNumber: 'A9477DY', firstName: 'Ted', lastName: 'Daphneson', cellLocation: '2-2-2' },
  { prisonerNumber: 'A5193DY', firstName: 'Jo', lastName: 'Bloggs', cellLocation: '3-3-3' },
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

  describe('POST', () => {
    it('should redirect to review upload a prisoner list view', async () => {
      when(activitiesService.getActivity).calledWith(1, res.locals.user).mockResolvedValue(mockActivity)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['G4793VF', 'A9477DY', 'A5193DY'], res.locals.user)
        .mockResolvedValue([prisonerA, prisonerB, prisonerC])

      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(['G4793VF', 'A9477DY', 'A5193DY'], res.locals.user)
        .mockResolvedValue([prisonerAllocations1, prisonerAllocations2, prisonerAllocations3])

      when(prisonService.searchPrisonInmates)
        .calledWith('', res.locals.user)
        .mockResolvedValue({ content: prisonersResult })

      when(nonAssociationsService.getListPrisonersWithNonAssociations)
        .calledWith(['G4793VF', 'A9477DY', 'A5193DY'], res.locals.user)
        .mockResolvedValue(['G4793VF'])

      req.body = {
        activityId: '1',
      }

      await handler.POST(req, res)

      const expectedInmates: Inmate[] = [
        {
          prisonerName: 'TEST01 PRISONER01',
          firstName: 'TEST01',
          lastName: 'PRISONER01',
          prisonerNumber: 'G4793VF',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
          cellLocation: '1-1-1',
          incentiveLevel: 'Standard',
          otherAllocations: [
            {
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
              status: 'ACTIVE',
            },
          ],
          nonAssociations: true,
        },
        {
          prisonerName: 'TEST02 PRISONER02',
          firstName: 'TEST02',
          lastName: 'PRISONER02',
          prisonerNumber: 'A9477DY',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
          cellLocation: '2-2-2',
          incentiveLevel: 'Basic',
          otherAllocations: [],
          nonAssociations: false,
        },
        {
          prisonerName: 'TEST02 PRISONER02',
          firstName: 'TEST02',
          lastName: 'PRISONER02',
          prisonerNumber: 'A5193DY',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
          cellLocation: '2-2-2',
          incentiveLevel: 'Basic',
          otherAllocations: [],
          nonAssociations: false,
        },
      ]

      expect(req.session.allocateJourney.inmates).toEqual(expectedInmates)
      expect(res.redirect).toHaveBeenCalledWith('review-upload-prisoner-list?fromActivity=Writing')
    })

    it('should fail to validate if there are no allocations for the activity to copy', async () => {
      mockActivity.schedules[0].allocations = []
      when(activitiesService.getActivity).calledWith(1, res.locals.user).mockResolvedValue(mockActivity)

      req.body = {
        activityId: '1',
      }

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('activityId', 'No-one is currently allocated to Writing')
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
