import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, format } from 'date-fns'
import { when } from 'jest-when'

import ActivitiesService from '../../../../services/activitiesService'
import ConfirmDeallocationIfExistingRoutes, { ConfirmDeallocateOptions } from './confirmDeallocationIfExisting'
import { Activity, Allocation } from '../../../../@types/activitiesAPI/types'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocation - Confirm existing deallocation', () => {
  const handler = new ConfirmDeallocationIfExistingRoutes(activitiesService)

  let req: Request
  let res: Response

  const user = { username: 'joebloggs' }

  const allocation = {
    id: 2,
    prisonerNumber: 'A1234AA',
    plannedDeallocation: {
      plannedDate: '2026-09-01',
    },
  } as Allocation

  const activity = {
    id: 2,
    schedules: [
      {
        id: 2,
        allocations: [{ id: 2, startDate: '2022-10-10' }],
      },
    ],
  } as unknown as Activity

  beforeEach(() => {
    req = {
      body: {},
      query: {
        allocationIds: '2',
      },
      session: {},
      journeyData: {
        allocateJourney: {
          inmates: [
            {
              prisonerNumber: 'A1234AA',
              prisonerName: 'Joe Bloggs',
            },
          ],
          activity: {
            activityId: 2,
            scheduleId: 2,
          },
        },
      },
    } as unknown as Request

    res = {
      locals: { user },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    when(activitiesService.getAllocations).calledWith(2, user).mockResolvedValue([allocation])

    when(activitiesService.getActivity).calledWith(2, user).mockResolvedValue(activity)
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    it('renders the prisoner and their existing end date', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/confirm-deallocation-if-existing', {
        selectedPrisoners: [
          {
            prisonerName: 'Joe Bloggs',
            endDate: '2026-09-01',
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('returns to the activity allocations when keeping the existing end date', async () => {
      req.body.choice = 'no'

      await handler.POST(req, res)

      expect(req.journeyData.allocateJourney).toBeNull()

      expect(res.redirect).toHaveBeenCalledWith('/activities/allocation-dashboard/2')
    })

    it('continues to choose a new end date when changing an existing end date', async () => {
      req.body.choice = 'yes'

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        '/activities/allocations/remove/deallocate-today-option?allocationIds=2&scheduleId=2',
      )
    })

    it('continues to the end decision when the allocation has not started yet', async () => {
      req.body.choice = 'yes'

      const futureStartDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

      when(activitiesService.getActivity)
        .calledWith(2, user)
        .mockResolvedValue({
          ...activity,
          schedules: [
            {
              id: 2,
              allocations: [
                {
                  id: 2,
                  startDate: futureStartDate,
                },
              ],
            },
          ],
        } as unknown as Activity)

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        '/activities/allocations/remove/end-decision?allocationIds=2&scheduleId=2',
      )
    })
  })

  describe('validation', () => {
    it('fails when no option is selected', async () => {
      const requestObject = plainToInstance(ConfirmDeallocateOptions, { choice: '' })

      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'choice',
          error: 'Select if you want to change the end date or leave it as it is',
        },
      ])
    })
  })
})
