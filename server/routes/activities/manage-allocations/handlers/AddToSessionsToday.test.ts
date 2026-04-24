import { Request, Response } from 'express'
import AddToSessionsToday from './AddToSessionsToday'
import { FormValidationError } from '../../../../middleware/formValidationErrorHandler'
import { Slot } from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'
import config from '../../../../config'

describe('Route Handlers - Allocation - Add To Sessions Today', () => {
  config.sameDayScheduleModificationsEnabled = true
  const handler = new AddToSessionsToday()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      journeyData: {
        allocateJourney: {
          inmate: {
            prisonerName: 'Jack Bloggs',
            prisonerNumber: 'ABC123',
          },
          updatedExclusions: [],
          futureSameDaySlots: [
            {
              weekNumber: 1,
              timeSlot: 'AM',
              monday: false,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false,
              daysOfWeek: ['MONDAY'],
            },
            {
              weekNumber: 1,
              timeSlot: 'PM',
              monday: false,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false,
              daysOfWeek: ['MONDAY'],
            },
          ],
        },
      },
      body: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it.each([
      {
        numSessions: 1,
        slots: [
          {
            weekNumber: 1,
            timeSlot: 'PM',
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
            daysOfWeek: ['MONDAY'],
          },
        ],
        expectedHeading: "Do you want to add Jack Bloggs to today's PM session?",
        expectedYes: "Yes, add them to today's PM session",
        expectedNo: 'No, add them to Monday PM sessions after today',
      },
      {
        numSessions: 2,
        slots: [
          {
            weekNumber: 1,
            timeSlot: 'AM',
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
            daysOfWeek: ['MONDAY'],
          },
          {
            weekNumber: 1,
            timeSlot: 'PM',
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
            daysOfWeek: ['MONDAY'],
          },
        ],
        expectedHeading: "Do you want to add Jack Bloggs to today's AM and PM sessions?",
        expectedYes: "Yes, add them to today's sessions",
        expectedNo: 'No, add them to Monday AM and PM sessions after today',
      },
      {
        numSessions: 3,
        slots: [
          {
            weekNumber: 1,
            timeSlot: 'AM',
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
            daysOfWeek: ['MONDAY'],
          },
          {
            weekNumber: 1,
            timeSlot: 'PM',
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
            daysOfWeek: ['MONDAY'],
          },
          {
            weekNumber: 1,
            timeSlot: 'ED',
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
            daysOfWeek: ['MONDAY'],
          },
        ],
        expectedHeading: "Do you want to add Jack Bloggs to today's AM, PM and ED sessions?",
        expectedYes: "Yes, add them to today's sessions",
        expectedNo: 'No, add them to Monday AM, PM and ED sessions after today',
      },
    ])(
      'should render correct text for $numSessions session(s)',
      async ({ slots, expectedHeading, expectedYes, expectedNo }) => {
        req.journeyData.allocateJourney.futureSameDaySlots = slots as Slot[]

        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith(
          'pages/activities/manage-allocations/addToSessionsToday',
          expect.objectContaining({
            headingText: expectedHeading,
            yesText: expectedYes,
            noText: expectedNo,
          }),
        )
      },
    )

    it('should redirect to exclusions when feature flag is disabled', async () => {
      config.sameDayScheduleModificationsEnabled = false

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('exclusions')
      expect(res.render).not.toHaveBeenCalled()
    })
  })

  describe('POST', () => {
    it('should set addToSessionsToday to true when yes is selected', async () => {
      req.body.addToSessionsToday = YesNo.YES

      await handler.POST(req, res)

      expect(req.journeyData.allocateJourney.addToSessionsToday).toBe(true)
      expect(res.redirect).toHaveBeenCalledWith('confirm-exclusions')
    })

    it('should set addToSessionsToday to false when no is selected', async () => {
      req.body.addToSessionsToday = YesNo.NO

      await handler.POST(req, res)

      expect(req.journeyData.allocateJourney.addToSessionsToday).toBe(false)
      expect(res.redirect).toHaveBeenCalledWith('confirm-exclusions')
    })

    it('should throw an error when no option is selected', async () => {
      req.body.addToSessionsToday = null

      await expect(handler.POST(req, res)).rejects.toThrow(FormValidationError)
    })
  })
})
