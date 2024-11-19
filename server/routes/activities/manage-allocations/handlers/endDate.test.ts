import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, addMinutes, startOfToday, subMinutes } from 'date-fns'
import { formatDate } from 'date-fns/format'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import EndDateRoutes, { EndDate } from './endDate'
import { formatDatePickerDate, formatIsoDate, isoDateToDatePickerDate } from '../../../../utils/datePickerUtils'
import { DeallocateTodayOption } from '../journey'

describe('Route Handlers - Edit allocation - End date', () => {
  const handler = new EndDateRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      params: { mode: 'create' },
      session: {
        allocateJourney: {
          startDate: formatIsoDate(new Date()),
          activity: {
            name: 'Maths Level 1',
          },
          inmate: {
            prisonerName: 'John Smith',
          },
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    const now = new Date()

    beforeEach(() => {
      const inmate = {
        prisonerNumber: 'ABC123',
        prisonerName: '',
        prisonCode: '',
        status: '',
      }

      req.session.allocateJourney = {
        inmate,
        inmates: [inmate],
        activity: {
          scheduleId: 0,
          name: '',
          startDate: '',
        },
        scheduledInstance: {
          attendances: [],
          cancelled: false,
          endTime: '',
          id: 0,
          timeSlot: undefined,
          date: formatIsoDate(now),
          startTime: formatDate(addMinutes(now, 2), 'HH:mm'),
        },
      }

      req.params.mode = 'remove'
    })

    it('should redirect to the dellocate today option view if there are sessions later today and only one prisoner is being deallocated', async () => {
      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('deallocate-today-option')
    })

    describe('should render end date view', () => {
      it('when mode is not remove', async () => {
        req.params.mode = 'create'

        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/end-date')
      })

      it('when multiple inmates are being deallocated', async () => {
        req.session.allocateJourney.inmates = [
          {
            prisonerNumber: 'ABC123',
            prisonerName: '',
            prisonCode: '',
            status: '',
          },
          {
            prisonerNumber: 'DE3455',
            prisonerName: '',
            prisonCode: '',
            status: '',
          },
        ]

        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/end-date')
      })

      it('when next session is tomorrow', async () => {
        req.session.allocateJourney.scheduledInstance.date = formatIsoDate(addDays(now, 1))

        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/end-date')
      })

      it('when there are no sessions later today', async () => {
        req.session.allocateJourney.scheduledInstance.startTime = formatDate(subMinutes(now, 1), 'HH:mm')

        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/end-date')
      })

      it('when there option has already been set', async () => {
        req.session.allocateJourney.deallocateTodayOption = DeallocateTodayOption.TODAY

        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/end-date')
      })
    })
  })

  describe('POST', () => {
    it('should redirect to the pay band page if in create mode and activity is paid', async () => {
      req.params.mode = 'create'

      req.session.allocateJourney.activity.paid = true

      const endDate = startOfToday()
      req.body = { endDate }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.endDate).toEqual(formatIsoDate(req.body.endDate))
      expect(res.redirectOrReturn).toHaveBeenCalledWith('pay-band')
    })

    it('should redirect to the check answers page if in create mode and activity is unpaid', async () => {
      req.params.mode = 'create'

      req.session.allocateJourney.activity.paid = false

      const endDate = startOfToday()
      req.body = { endDate }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.endDate).toEqual(formatIsoDate(req.body.endDate))
      expect(res.redirectOrReturn).toHaveBeenCalledWith('exclusions')
    })

    it('should redirect to the deallocate reason page in remove mode', async () => {
      req.params.mode = 'remove'

      const endDate = startOfToday()
      req.body = { endDate }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.endDate).toEqual(formatIsoDate(req.body.endDate))
      expect(res.redirectOrReturn).toHaveBeenCalledWith('reason')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const endDate = ''

      const body = { endDate }

      const requestObject = plainToInstance(EndDate, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([{ property: 'endDate', error: 'Enter a valid end date' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        endDate: 'a/1/2023',
      }

      const requestObject = plainToInstance(EndDate, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([{ property: 'endDate', error: 'Enter a valid end date' }])
    })

    it('validation fails if end date is not same or after latest allocation start date', async () => {
      const endDate = formatDatePickerDate(addDays(new Date(), 1))

      const request = {
        endDate,
        startDate: '2023-08-25',
        allocationId: 1,
        scheduleId: 1,
        prisonerNumber: 'ABC123',
        allocateJourney: {
          latestAllocationStartDate: formatIsoDate(addDays(new Date(), 2)),
          inmate: {
            prisonerNumber: 'ABC123',
          },
          activity: {
            scheduleId: 1,
          },
        },
      }

      const requestObject = plainToInstance(EndDate, request)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'endDate',
          error: `Enter a date on or after the allocation start date, ${isoDateToDatePickerDate(
            request.allocateJourney.latestAllocationStartDate,
          )}`,
        },
      ])
    })
  })
})
