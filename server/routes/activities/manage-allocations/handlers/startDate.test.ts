import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, addMonths } from 'date-fns'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import StartDateRoutes, { StartDate } from './startDate'
import { formatDatePickerDate, formatIsoDate } from '../../../../utils/datePickerUtils'
import ActivitiesService from '../../../../services/activitiesService'
import config from '../../../../config'
import { StartDateOption } from '../journey'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Edit allocation - Start date', () => {
  const handler = new StartDateRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: { mode: 'create', allocationId: 1 },
      session: {
        allocateJourney: {
          inmate: {
            prisonerName: 'John Smith',
          },
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/start-date')
    })
  })

  describe('POST', () => {
    describe('Create', () => {
      it('should save entered start date in session and redirect if user selected a specific date', async () => {
        req.body = {
          startDateOption: StartDateOption.START_DATE,
          startDate: new Date(2024, 3, 23),
        }

        await handler.POST(req, res)

        expect(res.redirectOrReturn).toHaveBeenCalledWith('end-date-option')
        expect(req.session.allocateJourney.startDateOption).toEqual(StartDateOption.START_DATE)
        expect(req.session.allocateJourney.startDate).toEqual('2024-04-23')
        expect(req.session.allocateJourney.latestAllocationStartDate).toEqual('2024-04-23')
      })

      it('should save next session start date in session and redirect if user selected the next session', async () => {
        req.session.allocateJourney.scheduledInstance = {
          attendances: [],
          cancelled: false,
          endTime: '',
          timeSlot: 'AM',
          startTime: '',
          id: 123,
          date: '2024-04-23',
        }

        req.body = {
          startDateOption: StartDateOption.NEXT_SESSION,
          startDate: new Date(),
        }

        await handler.POST(req, res)

        expect(res.redirectOrReturn).toHaveBeenCalledWith('end-date-option')
        expect(req.session.allocateJourney.startDateOption).toEqual(StartDateOption.NEXT_SESSION)
        expect(req.session.allocateJourney.startDate).toEqual('2024-04-23')
        expect(req.session.allocateJourney.latestAllocationStartDate).toEqual('2024-04-23')
      })
    })

    describe('Edit', () => {
      beforeEach(() => {
        req.params.mode = 'edit'
      })

      it('should update the allocation and redirect with success if user selected a specific date', async () => {
        req.body = { startDate: new Date(2024, 3, 23) }

        await handler.POST(req, res)

        expect(req.session.allocateJourney.startDate).toEqual('2024-04-23')
        expect(req.session.allocateJourney.latestAllocationStartDate).toEqual('2024-04-23')

        expect(activitiesService.updateAllocation).toHaveBeenCalledWith(
          1,
          {
            startDate: formatIsoDate(req.body.startDate),
            scheduleInstanceId: null,
          },
          res.locals.user,
        )
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/activities/allocations/view/1`,
          'Allocation updated',
          `You've updated the start date for this allocation`,
        )
      })

      it('should update the allocation and redirect with success if user selected the next session', async () => {
        req.session.allocateJourney.scheduledInstance = {
          attendances: [],
          cancelled: false,
          endTime: '',
          startTime: '',
          timeSlot: 'AM',
          id: 123,
          date: '2024-04-23',
        }

        req.body = {
          startDateOption: 'NEXT_SESSION',
        }

        await handler.POST(req, res)

        expect(req.session.allocateJourney.startDate).toEqual('2024-04-23')
        expect(req.session.allocateJourney.latestAllocationStartDate).toEqual('2024-04-23')

        expect(activitiesService.updateAllocation).toHaveBeenCalledWith(
          1,
          {
            startDate: '2024-04-23',
            scheduleInstanceId: 123,
          },
          res.locals.user,
        )
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `/activities/allocations/view/1`,
          'Allocation updated',
          `You've updated the start date for this allocation`,
        )
      })
    })
  })

  describe('type validation', () => {
    // TODO: SAA-671 - remove
    describe('legacy', () => {
      const activityStartDate = addMonths(new Date(), 1)
      const activityEndDate = addDays(activityStartDate, 2)

      const allocateJourney = {
        activity: {
          startDate: formatIsoDate(activityStartDate),
          endDate: formatIsoDate(activityEndDate),
        },
      }

      beforeEach(() => {
        config.allocateToNextSession = false
      })

      it('validation fails if a value is not entered', async () => {
        const startDate = ''

        const body = { startDate }

        const requestObject = plainToInstance(StartDate, {
          ...body,
          allocateJourney,
        })
        const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
          errs.flatMap(associateErrorsWithProperty),
        )

        expect(errors).toEqual([{ property: 'startDate', error: 'Enter a valid start date' }])
      })

      it('validation fails if a bad value is entered', async () => {
        const startDate = 'a/1/2023'

        const body = { startDate }

        const requestObject = plainToInstance(StartDate, {
          ...body,
          allocateJourney,
        })
        const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
          errs.flatMap(associateErrorsWithProperty),
        )

        expect(errors).toEqual([{ property: 'startDate', error: 'Enter a valid start date' }])
      })

      it('validation fails if start date is in past', async () => {
        const yesterday = addDays(new Date(), -1)
        const startDate = formatDatePickerDate(yesterday)

        const body = { startDate }

        const requestObject = plainToInstance(StartDate, {
          ...body,
          allocateJourney,
        })
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual([{ property: 'startDate', error: 'Enter a date in the future' }])
      })

      it('validation fails if start date is before activity start date', async () => {
        const startDate = addDays(activityStartDate, -1)

        const body = {
          startDate: formatDatePickerDate(startDate),
        }

        const requestObject = plainToInstance(StartDate, {
          ...body,
          allocateJourney,
        })
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual([
          {
            property: 'startDate',
            error: `Enter a date on or after the activity's start date, ${formatDatePickerDate(activityStartDate)}`,
          },
        ])
      })

      it('validation fails if start date is after activity end date', async () => {
        const body = {
          startDate: formatDatePickerDate(addDays(activityEndDate, 1)),
        }

        const requestObject = plainToInstance(StartDate, {
          ...body,
          allocateJourney,
        })
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual([
          {
            property: 'startDate',
            error: `Enter a date on or before the activity's end date, ${formatDatePickerDate(activityEndDate)}`,
          },
        ])
      })
    })

    const activityStartDate = addMonths(new Date(), 1)
    const activityEndDate = addDays(activityStartDate, 2)

    const allocateJourney = {
      activity: {
        startDate: formatIsoDate(activityStartDate),
        endDate: formatIsoDate(activityEndDate),
      },
    }

    beforeEach(() => {
      config.allocateToNextSession = true
    })

    it('validation fails if start date option is not selected', async () => {
      const body = {}

      const requestObject = plainToInstance(StartDate, {
        ...body,
        allocateJourney,
      })
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([
        { property: 'startDateOption', error: 'Select whether start date is next session or a different date' },
      ])
    })

    describe('Next Session', () => {
      it('validation fails if start date option is not selected', async () => {
        const body = { startDateOption: 'junk' }

        const requestObject = plainToInstance(StartDate, {
          ...body,
          allocateJourney,
        })
        const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
          errs.flatMap(associateErrorsWithProperty),
        )

        expect(errors).toEqual([
          {
            property: 'startDateOption',
            error: 'Select whether start date is next session or a different date',
          },
        ])
      })
    })

    describe('Start Date', () => {
      const body = {
        startDateOption: 'START_DATE',
        startDate: '',
      }

      it('validation fails if a value is not entered', async () => {
        const requestObject = plainToInstance(StartDate, {
          ...body,
          allocateJourney,
        })
        const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
          errs.flatMap(associateErrorsWithProperty),
        )

        expect(errors).toEqual([{ property: 'startDate', error: 'Enter a valid start date' }])
      })

      it('validation fails if a bad value is entered', async () => {
        body.startDate = 'a/1/2023'

        const requestObject = plainToInstance(StartDate, {
          ...body,
          allocateJourney,
        })
        const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
          errs.flatMap(associateErrorsWithProperty),
        )

        expect(errors).toEqual([{ property: 'startDate', error: 'Enter a valid start date' }])
      })

      it('validation fails if start date is in past', async () => {
        const yesterday = addDays(new Date(), -1)
        body.startDate = formatDatePickerDate(yesterday)

        const requestObject = plainToInstance(StartDate, {
          ...body,
          allocateJourney,
        })
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual([{ property: 'startDate', error: 'Enter a date in the future' }])
      })

      it('validation fails if start date is before activity start date', async () => {
        body.startDate = formatDatePickerDate(addDays(activityStartDate, -1))

        const requestObject = plainToInstance(StartDate, {
          ...body,
          allocateJourney,
        })
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual([
          {
            property: 'startDate',
            error: `Enter a date on or after the activity's start date, ${formatDatePickerDate(activityStartDate)}`,
          },
        ])
      })

      it('validation fails if start date is after activity end date', async () => {
        body.startDate = formatDatePickerDate(addDays(activityEndDate, 1))

        const requestObject = plainToInstance(StartDate, {
          ...body,
          allocateJourney,
        })
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual([
          {
            property: 'startDate',
            error: `Enter a date on or before the activity's end date, ${formatDatePickerDate(activityEndDate)}`,
          },
        ])
      })
    })
  })
})
