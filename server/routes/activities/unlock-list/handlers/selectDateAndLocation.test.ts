import { Request, Response } from 'express'
import { format, addDays } from 'date-fns'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import SelectDateAndLocationRoutes, { DateAndLocation } from './selectDateAndLocation'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import { LocationGroup } from '../../../../@types/activitiesAPI/types'
import atLeast from '../../../../../jest.setup'
import { formatDatePickerDate } from '../../../../utils/datePickerUtils'

jest.mock('../../../../services/activitiesService')
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

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

    req = {
      session: {},
      query: {},
    } as unknown as Request
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      when(activitiesService.getLocationGroups)
        .calledWith(atLeast(res.locals.user))
        .mockResolvedValue(mockedLocationGroups)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/unlock-list/select-date-and-location', {
        locationGroups: mockedLocationGroups,
        activitySlot: null,
        date: null,
        datePresetOption: null,
        locationKey: null,
      })
      expect(activitiesService.getLocationGroups).toHaveBeenCalledTimes(1)
      expect(activitiesService.getLocationGroups).toHaveBeenCalledWith(res.locals.user)
      expect(req.session.unlockListJourney).not.toBeNull()
    })
    it('should render the expected view - coming back on back link', async () => {
      when(activitiesService.getLocationGroups)
        .calledWith(atLeast(res.locals.user))
        .mockResolvedValue(mockedLocationGroups)

      req.query = {
        date: '2025-01-01',
        activitySlot: 'AM',
        locationKey: 'A-wing',
      }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/unlock-list/select-date-and-location', {
        locationGroups: mockedLocationGroups,
        activitySlot: 'AM',
        date: '01/01/2025',
        datePresetOption: 'other',
        locationKey: 'A-wing',
      })
      expect(activitiesService.getLocationGroups).toHaveBeenCalledTimes(1)
      expect(activitiesService.getLocationGroups).toHaveBeenCalledWith(res.locals.user)
      expect(req.session.unlockListJourney).not.toBeNull()
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      req.session.unlockListJourney = {
        subLocationFilters: ['A-Wing'],
        activityFilter: 'Without',
        stayingOrLeavingFilter: 'Staying',
      }
    })

    it("redirect with the expected query params for when today's date is selected", async () => {
      req.body = {
        datePresetOption: 'today',
        activitySlot: 'AM',
        locationKey: 'here',
      }
      const todaysDate = format(new Date(), 'yyyy-MM-dd')

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`planned-events?date=${todaysDate}`)
      expect(req.session.unlockListJourney.timeSlot).toEqual('AM')
      expect(req.session.unlockListJourney.locationKey).toEqual('here')
    })

    it("redirect with the expected query params for when tomorrow's date is selected", async () => {
      req.body = {
        datePresetOption: 'tomorrow',
        activitySlot: 'AM',
        locationKey: 'here',
      }
      const tomorrowsDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`planned-events?date=${tomorrowsDate}`)
      expect(req.session.unlockListJourney.timeSlot).toEqual('AM')
      expect(req.session.unlockListJourney.locationKey).toEqual('here')
    })

    it('redirects with the expected query params for when a custom date is selected', async () => {
      req.body = {
        datePresetOption: 'other',
        date: new Date('2022-12-01'),
        activitySlot: 'AM',
        locationKey: 'here',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`planned-events?date=2022-12-01`)
      expect(req.session.unlockListJourney.timeSlot).toEqual('AM')
      expect(req.session.unlockListJourney.locationKey).toEqual('here')
    })
  })

  describe('DateAndLocation type validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(DateAndLocation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'datePresetOption', error: 'Select a date' },
        { property: 'activitySlot', error: 'Select a time' },
        { property: 'locationKey', error: 'Select a location' },
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
        { property: 'datePresetOption', error: 'Select a date' },
        { property: 'activitySlot', error: 'Select a time' },
        { property: 'locationKey', error: 'Select a location' },
      ])
    })

    it('validation fails if preset option is other and a date is not provided', async () => {
      const body = {
        datePresetOption: 'other',
        date: {},
        activitySlot: 'AM',
        locationKey: 'some location',
      }

      const requestObject = plainToInstance(DateAndLocation, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails if preset option is other and a bad date is provided', async () => {
      const body = {
        datePresetOption: 'other',
        date: '2022/2/31',
        activitySlot: 'AM',
        locationKey: 'here',
      }

      const requestObject = plainToInstance(DateAndLocation, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('passes validation if date under 60 days into the future', async () => {
      const dateIn59Days = addDays(new Date(), 59)
      const body = {
        datePresetOption: 'other',
        date: formatDatePickerDate(dateIn59Days),
        activitySlot: 'AM',
        locationKey: 'here',
      }

      const requestObject = plainToInstance(DateAndLocation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('passes validation if date equal to 60 days in the future', async () => {
      const dateIn60Days = addDays(new Date(), 60)
      const body = {
        datePresetOption: 'other',
        date: formatDatePickerDate(dateIn60Days),
        activitySlot: 'AM',
        locationKey: 'here',
      }

      const requestObject = plainToInstance(DateAndLocation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('validation fails if date is more than 60 days into the future', async () => {
      const dateIn61Days = addDays(new Date(), 61)
      const body = {
        datePresetOption: 'other',
        date: formatDatePickerDate(dateIn61Days),
        activitySlot: 'AM',
        locationKey: 'some location',
      }

      const requestObject = plainToInstance(DateAndLocation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a date up to 60 days in the future' }])
    })
  })
})
