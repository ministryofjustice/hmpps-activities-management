import { Request, Response } from 'express'
import { when } from 'jest-when'
import { Inmate } from '../../journey'
import ActivitiesService from '../../../../../services/activitiesService'
import { Activity, ActivityPay, Allocation } from '../../../../../@types/activitiesAPI/types'
import ReviewUploadPrisonerListRoutes from './reviewUploadPrisonerList'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const activity: Activity = {
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
  schedules: [],
  startDate: '',
  summary: '',
}

const allocation: Allocation = {
  activityId: 22,
  activitySummary: 'Alread Allocated',
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

const inmateWithBasic: Inmate = {
  prisonerName: 'TEST01 PRISONER01',
  firstName: 'TEST01',
  lastName: 'PRISONER01',
  prisonerNumber: 'A1234BC',
  prisonCode: 'TPR',
  status: 'ACTIVE IN',
  cellLocation: '1-1-1',
  incentiveLevel: 'Basic',
  payBand: undefined,
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
      status: undefined,
    },
  ],
}

const inmateWithStandard: Inmate = {
  prisonerName: 'TEST02 PRISONER02',
  firstName: 'TEST02',
  lastName: 'PRISONER02',
  prisonerNumber: 'B2345CD',
  prisonCode: 'TPR',
  status: 'ACTIVE IN',
  cellLocation: '2-2-2',
  incentiveLevel: 'Standard',
  payBand: undefined,
  otherAllocations: [],
}

const inmateWithEnhanced: Inmate = {
  prisonerName: 'TEST02 PRISONER02',
  firstName: 'TEST02',
  lastName: 'PRISONER02',
  prisonerNumber: 'B2345CD',
  prisonCode: 'TPR',
  status: 'ACTIVE IN',
  cellLocation: '2-2-2',
  incentiveLevel: 'Enhanced',
  payBand: undefined,
  otherAllocations: [],
}

const activityPayBasic: ActivityPay = {
  id: 1,
  incentiveLevel: 'Basic',
  incentiveNomisCode: 'BAS',
  prisonPayBand: { alias: '', description: '', displaySequence: 0, id: 0, nomisPayBand: 0, prisonCode: '' },
}
const activityPayStandard: ActivityPay = {
  id: 1,
  incentiveLevel: 'Standard',
  incentiveNomisCode: 'BAS',
  prisonPayBand: { alias: '', description: '', displaySequence: 0, id: 0, nomisPayBand: 0, prisonCode: '' },
}
const activityPayEnhanced: ActivityPay = {
  id: 1,
  incentiveLevel: 'Enhanced',
  incentiveNomisCode: 'BAS',
  prisonPayBand: { alias: '', description: '', displaySequence: 0, id: 0, nomisPayBand: 0, prisonCode: '' },
}

describe('Allocate multiple people to an activity - upload a prisoner list', () => {
  const handler = new ReviewUploadPrisonerListRoutes(activitiesService)
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
          inmates: [inmateWithBasic, inmateWithStandard, inmateWithEnhanced],
          activity: {
            activityId: 1,
            scheduleId: 1,
          },
        },
      },
      query: {},
      params: {},
    } as unknown as Request
  })
  describe('GET', () => {
    it('should add all allocations to the unallocated list when all are new allocations and have incentive level', async () => {
      const activityPay: ActivityPay[] = [activityPayBasic, activityPayStandard, activityPayEnhanced]
      activity.pay = activityPay

      when(activitiesService.getActivity).calledWith(1, res.locals.user).mockResolvedValue(activity)

      when(activitiesService.getAllocationsWithParams)
        .calledWith(1, { includePrisonerSummary: true }, res.locals.user)
        .mockResolvedValue([])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/reviewUploadPrisonerList',
        {
          unallocatedInmates: [inmateWithBasic, inmateWithStandard, inmateWithEnhanced],
          allocatedInmates: [],
          withoutMatchingIncentiveLevelInmates: [],
        },
      )
    })

    it('should add correct allocations to unallocated and already allocated lists when there are duplicate allocations', async () => {
      const activityPay: ActivityPay[] = [activityPayBasic, activityPayStandard, activityPayEnhanced]
      activity.pay = activityPay

      when(activitiesService.getActivity).calledWith(1, res.locals.user).mockResolvedValue(activity)

      when(activitiesService.getAllocationsWithParams)
        .calledWith(1, { includePrisonerSummary: true }, res.locals.user)
        .mockResolvedValue([allocation])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/reviewUploadPrisonerList',
        {
          unallocatedInmates: [inmateWithStandard, inmateWithEnhanced],
          allocatedInmates: [inmateWithBasic],
          withoutMatchingIncentiveLevelInmates: [],
        },
      )
    })

    it('should add correct allocations to unallocated and failed incentive level lists when some allocation do not have the required incentive level', async () => {
      when(activitiesService.getActivity).calledWith(1, res.locals.user).mockResolvedValue(activity)

      when(activitiesService.getAllocationsWithParams)
        .calledWith(1, { includePrisonerSummary: true }, res.locals.user)
        .mockResolvedValue([])

      const activityPay: ActivityPay[] = [activityPayStandard, activityPayEnhanced]
      activity.pay = activityPay

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/reviewUploadPrisonerList',
        {
          unallocatedInmates: [inmateWithStandard, inmateWithEnhanced],
          allocatedInmates: [],
          withoutMatchingIncentiveLevelInmates: [inmateWithBasic],
        },
      )
    })
  })

  describe('REMOVE', () => {
    it('should remove an allocation from the list', async () => {
      req.params.prisonNumber = 'A1234BC'
      await handler.REMOVE(req, res)
      expect(res.redirect).toHaveBeenCalledWith('../../review-upload-prisoner-list')
      expect(req.session.allocateJourney.inmates).toEqual([inmateWithStandard, inmateWithEnhanced])
    })
  })

  describe('POST', () => {
    it('should redirect to FIXME view', async () => {
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('activity-requirements-review')
    })
  })
})
