import { Request, Response } from 'express'
import { format, subDays } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SelectDateAndLocationRoutes, { DateAndLocation } from './selectDateAndLocation'
import { associateErrorsWithProperty } from '../../../utils/utils'
import ActivitiesService from '../../../services/activitiesService'
import { LocationGroup } from '../../../@types/activitiesAPI/types'
import SimpleDate from '../../../commonValidationTypes/simpleDate'

jest.mock('../../../services/activitiesService')
const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Unlock list routes - select date and location', () => {
  const handler = new SelectDateAndLocationRoutes(activitiesService)
  let req: Request
  let res: Response
  const mockedLocationGroups = [
    {
      name: 'Houseblock 1',
      key: 'Houseblock 1',
      children: [],
    },
  ] as LocationGroup[]

  beforeEach(() => {
    res = {
      locals: {
        user: {
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {} as unknown as Request
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      activitiesService.getLocationGroups.mockResolvedValue(mockedLocationGroups)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/unlock-list/select-date-and-location', {
        locationGroups: mockedLocationGroups,
      })
      expect(activitiesService.getLocationGroups).toHaveBeenCalledTimes(1)
      expect(activitiesService.getLocationGroups).toHaveBeenCalledWith('MDI', res.locals.user)
    })
  })

  describe('POST', () => {
    it("redirect with the expected query params for when today's date is selected", async () => {
      req.body = {
        datePresetOption: 'today',
        activitySlot: 'am',
        location: 'here',
      }
      const todaysDate = format(new Date(), 'yyyy-MM-dd')

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        `planned-events?datePresetOption=today&date=${todaysDate}&slot=am&location=here`,
      )
    })

    it("redirect with the expected query params for when yesterday's date is selected", async () => {
      req.body = {
        datePresetOption: 'yesterday',
        activitySlot: 'am',
        location: 'here',
      }
      const yesterdaysDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        `planned-events?datePresetOption=yesterday&date=${yesterdaysDate}&slot=am&location=here`,
      )
    })

    it('redirects with the expected query params for when a custom date is selected', async () => {
      const testDate = plainToInstance(SimpleDate, {
        day: 1,
        month: 12,
        year: 2022,
      })

      req.body = {
        datePresetOption: 'other',
        date: testDate,
        activitySlot: 'am',
        location: 'here',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        `planned-events?datePresetOption=other&date=2022-12-01&slot=am&location=here`,
      )
    })
  })

  describe('DateAndLocation type validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(DateAndLocation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'datePresetOption', error: 'Select a date for the unlock list' },
        { property: 'activitySlot', error: 'Select a time slot' },
        { property: 'location', error: 'Select a location' },
      ])
    })

    it('validation fails if invalid values are entered', async () => {
      const body = {
        datePresetOption: 'invalid',
        activitySlot: 'invalid',
      }

      const requestObject = plainToInstance(DateAndLocation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'datePresetOption', error: 'Select a date for the unlock list' },
        { property: 'activitySlot', error: 'Select a time slot' },
        { property: 'location', error: 'Select a location' },
      ])
    })

    it('validation fails if preset option is other and a date is not provided', async () => {
      const body = {
        datePresetOption: 'other',
        date: {},
        activitySlot: 'am',
        location: 'some location',
      }

      const requestObject = plainToInstance(DateAndLocation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails if preset option is other and a bad date is provided', async () => {
      const body = {
        datePresetOption: 'other',
        date: { day: 31, month: 2, year: 2022 },
        activitySlot: 'am',
        location: 'here',
      }

      const requestObject = plainToInstance(DateAndLocation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('passes validation', async () => {
      const body = {
        datePresetOption: 'other',
        date: { day: 27, month: 2, year: 2022 },
        activitySlot: 'am',
        location: 'here',
      }

      const requestObject = plainToInstance(DateAndLocation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
