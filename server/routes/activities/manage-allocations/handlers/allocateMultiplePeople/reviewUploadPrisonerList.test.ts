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
  paid: true,
  pay: [],
  payChange: [],
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
  activitySummary: 'Already Allocated',
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
  incentiveNomisCode: 'STD',
  prisonPayBand: { alias: '', description: '', displaySequence: 0, id: 0, nomisPayBand: 0, prisonCode: '' },
}
const activityPayEnhanced: ActivityPay = {
  id: 1,
  incentiveLevel: 'Enhanced',
  incentiveNomisCode: 'ENH',
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
      journeyData: {
        allocateJourney: {
          inmates: [inmateWithBasic, inmateWithStandard, inmateWithEnhanced],
          activity: {
            activityId: 1,
            scheduleId: 1,
            name: 'Box making',
          },
          notFoundPrisoners: ['dsfkjf', '234243df', 'Raf21A'],
        },
      },
      query: {},
      params: {},
    } as unknown as Request
  })
  describe('GET', () => {
    it('should redirect to the review page if there are no identifiable  prison numbers', async () => {
      req = {
        journeyData: {
          allocateJourney: {
            inmates: [],
            activity: {
              scheduleId: 1,
            },
            unidentifiable: true,
          },
        },
        query: {},
        params: {},
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/reviewUploadPrisonerList',
        { unidentifiable: true },
      )
    })

    it('should not check incentive levels if the activity is unpaid, and add prisoners to session appropriately', async () => {
      activity.paid = false
      activity.pay = []
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
          notFoundPrisoners: ['dsfkjf', '234243df', 'Raf21A'],
        },
      )
    })

    it('should add all allocations to the unallocated list when all are new allocations and have incentive level', async () => {
      activity.paid = true
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
          notFoundPrisoners: ['dsfkjf', '234243df', 'Raf21A'],
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
          cannotAllocateMessage: '1 person from  your CSV file cannot be allocated',
          notFoundPrisoners: ['dsfkjf', '234243df', 'Raf21A'],
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
          cannotAllocateMessage: '1 person from  your CSV file cannot be allocated',
          notFoundPrisoners: ['dsfkjf', '234243df', 'Raf21A'],
        },
      )
    })

    it('should add correct allocations to unallocated and failed incentive level lists when one allocation does not have the required incentive level - from activity', async () => {
      req.query = {
        fromActivity: 'Cooking',
      }

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
          cannotAllocateMessage: '1 person from Cooking cannot be allocated to Box making',
          notFoundPrisoners: ['dsfkjf', '234243df', 'Raf21A'],
        },
      )
    })

    it('should add correct allocations to unallocated and failed incentive level lists when two allocations do not have the required incentive level - from activity', async () => {
      req.query = {
        fromActivity: 'Cooking',
      }

      when(activitiesService.getActivity).calledWith(1, res.locals.user).mockResolvedValue(activity)

      when(activitiesService.getAllocationsWithParams)
        .calledWith(1, { includePrisonerSummary: true }, res.locals.user)
        .mockResolvedValue([])

      const activityPay: ActivityPay[] = [activityPayEnhanced]
      activity.pay = activityPay

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/reviewUploadPrisonerList',
        {
          unallocatedInmates: [inmateWithEnhanced],
          allocatedInmates: [],
          withoutMatchingIncentiveLevelInmates: [inmateWithBasic, inmateWithStandard],
          cannotAllocateMessage: '2 people from Cooking cannot be allocated to Box making',
          notFoundPrisoners: ['dsfkjf', '234243df', 'Raf21A'],
        },
      )
    })
    it('should pass the empty allocations title text when there are no people to allocate', async () => {
      req.query = {
        fromActivity: 'Cooking',
      }

      const activityPay: ActivityPay[] = []
      activity.pay = activityPay

      when(activitiesService.getActivity).calledWith(1, res.locals.user).mockResolvedValue(activity)

      when(activitiesService.getAllocationsWithParams)
        .calledWith(1, { includePrisonerSummary: true }, res.locals.user)
        .mockResolvedValue([allocation])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/reviewUploadPrisonerList',
        {
          unallocatedInmates: [],
          allocatedInmates: [
            {
              cellLocation: '1-1-1',
              firstName: 'TEST01',
              incentiveLevel: 'Basic',
              lastName: 'PRISONER01',
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
              payBand: undefined,
              prisonCode: 'TPR',
              prisonerName: 'TEST01 PRISONER01',
              prisonerNumber: 'A1234BC',
              startDate: '2024-01-01',
              status: 'ACTIVE IN',
            },
          ],
          withoutMatchingIncentiveLevelInmates: [
            {
              cellLocation: '2-2-2',
              firstName: 'TEST02',
              incentiveLevel: 'Standard',
              lastName: 'PRISONER02',
              otherAllocations: [],
              payBand: undefined,
              prisonCode: 'TPR',
              prisonerName: 'TEST02 PRISONER02',
              prisonerNumber: 'B2345CD',
              status: 'ACTIVE IN',
            },
            {
              cellLocation: '2-2-2',
              firstName: 'TEST02',
              incentiveLevel: 'Enhanced',
              lastName: 'PRISONER02',
              otherAllocations: [],
              payBand: undefined,
              prisonCode: 'TPR',
              prisonerName: 'TEST02 PRISONER02',
              prisonerNumber: 'B2345CD',
              status: 'ACTIVE IN',
            },
          ],
          notFoundPrisoners: ['dsfkjf', '234243df', 'Raf21A'],
          cannotAllocateMessage: '3 people from Cooking cannot be allocated to Box making',
          nobodyToAllocateTitle: 'No-one from Cooking can be allocated',
        },
      )
    })
  })

  describe('REMOVE', () => {
    it('should remove an allocation from the list', async () => {
      req.params.prisonNumber = 'A1234BC'
      await handler.REMOVE(req, res)
      expect(res.redirect).toHaveBeenCalledWith('../../review-upload-prisoner-list')
      expect(req.journeyData.allocateJourney.inmates).toEqual([inmateWithStandard, inmateWithEnhanced])
    })
  })

  describe('POST', () => {
    it('should redirect to FIXME view', async () => {
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('activity-requirements-review')
    })
  })
})
