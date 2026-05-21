import { Request, Response } from 'express'
import RunSessionTodayRoutes from './runSessionToday'
import { FormValidationError } from '../../../../middleware/formValidationErrorHandler'
import { Slot, Activity } from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'
import ActivitiesService from '../../../../services/activitiesService'

describe('Route Handlers - Create Activity - Run Session Today', () => {
  const mockUpdateActivity = jest.fn()
  const activitiesService = {
    updateActivity: mockUpdateActivity,
  } as unknown as ActivitiesService

  const handler = new RunSessionTodayRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    jest.clearAllMocks()

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
      locals: {
        user: { activeCaseLoadId: 'MDI' },
      },
    } as unknown as Response

    req = {
      journeyData: {
        createJourney: {
          activityId: 1,
          name: 'Test Activity',
          scheduleWeeks: 2,
          slots: {
            '1': {
              days: ['monday', 'wednesday', 'friday'],
              timeSlotsMonday: ['AM', 'PM'],
              timeSlotsWednesday: ['PM'],
              timeSlotsFriday: ['AM'],
            },
            '2': {
              days: ['tuesday', 'thursday'],
              timeSlotsTuesday: ['AM', 'PM'],
              timeSlotsThursday: ['PM', 'ED'],
            },
          },
          // Tuesday in the days of the week so we can test that it doesnt get included in the future same day sessions
          customSlots: [
            {
              weekNumber: 1,
              timeSlot: 'AM',
              monday: true,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false,
              daysOfWeek: ['MONDAY', 'TUESDAY'],
            },
            {
              weekNumber: 1,
              timeSlot: 'PM',
              monday: true,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false,
              daysOfWeek: ['MONDAY'],
            },
          ],
          futureSameDaySlots: [
            {
              weekNumber: 1,
              timeSlot: 'AM',
              monday: true,
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
              monday: true,
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

  describe('GET - Text Generation', () => {
    describe('should render correct text for different scenarios', () => {
      it.each([
        {
          scenario: 'single future session, no ended sessions',
          futureSameDaySlots: [
            {
              weekNumber: 1,
              timeSlot: 'PM',
              monday: false,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: true,
              saturday: false,
              sunday: false,
              daysOfWeek: ['FRIDAY'],
            },
          ],
          allSameDaySlots: undefined,
          expectedHeading: 'Do you want the Friday PM session to run today?',
          expectedYesText: 'Yes',
          expectedNoText: 'No, add the Friday PM session after today',
          expectedInsetText: "You're adding Friday PM to this activity's schedule.",
        },
        {
          scenario: 'multiple future sessions, no ended sessions',
          futureSameDaySlots: [
            {
              weekNumber: 1,
              timeSlot: 'AM',
              monday: true,
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
              monday: true,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false,
              daysOfWeek: ['MONDAY'],
            },
          ],
          allSameDaySlots: undefined,
          expectedHeading: 'Do you want the Monday AM and PM sessions to run today?',
          expectedYesText: 'Yes',
          expectedNoText: 'No, add the Monday AM and PM sessions after today',
          expectedInsetText: "You're adding Monday AM and PM to this activity's schedule.",
        },
        {
          scenario: 'three future sessions, no ended sessions',
          futureSameDaySlots: [
            {
              weekNumber: 1,
              timeSlot: 'AM',
              monday: true,
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
              monday: true,
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
              monday: true,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false,
              daysOfWeek: ['MONDAY'],
            },
          ],
          allSameDaySlots: undefined,
          expectedHeading: 'Do you want the Monday AM, PM and ED sessions to run today?',
          expectedYesText: 'Yes',
          expectedNoText: 'No, add the Monday AM, PM and ED sessions after today',
          expectedInsetText: "You're adding Monday AM, PM and ED to this activity's schedule.",
        },
        {
          scenario: 'multiple future sessions with some already ended',
          futureSameDaySlots: [
            {
              weekNumber: 1,
              timeSlot: 'PM',
              monday: true,
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
              monday: true,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false,
              daysOfWeek: ['MONDAY'],
            },
          ],
          allSameDaySlots: [
            {
              weekNumber: 1,
              timeSlot: 'AM',
              monday: true,
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
              monday: true,
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
              monday: true,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false,
              daysOfWeek: ['MONDAY'],
            },
          ],
          expectedHeading: 'Do you want the Monday PM and ED sessions to run today?',
          expectedYesText: 'Yes, the PM and ED sessions of this activity will run today',
          expectedNoText: 'No, add them to Monday PM and ED sessions after today',
          expectedInsetText:
            "You're adding Monday PM and ED to this activity's schedule.<br> The AM session cannot be added for today as it has already ended.",
        },
      ])(
        '$scenario',
        async ({
          futureSameDaySlots,
          allSameDaySlots,
          expectedHeading,
          expectedYesText,
          expectedNoText,
          expectedInsetText,
        }) => {
          req.journeyData.createJourney.futureSameDaySlots = futureSameDaySlots as Slot[]
          if (allSameDaySlots) {
            req.journeyData.createJourney.allSameDaySlots = allSameDaySlots as Slot[]
          }

          await handler.GET(req, res)

          expect(res.render).toHaveBeenCalledWith(
            'pages/activities/create-an-activity/run-session-today',
            expect.objectContaining({
              headingText: expectedHeading,
              yesText: expectedYesText,
              noText: expectedNoText,
              insetText: expectedInsetText,
            }),
          )
        },
      )
    })

    it('should redirect to /activities when futureSameDaySlots is empty', async () => {
      req.journeyData.createJourney.futureSameDaySlots = []

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/activities')
      expect(res.render).not.toHaveBeenCalled()
    })

    it('should redirect to /activities when futureSameDaySlots is undefined', async () => {
      req.journeyData.createJourney.futureSameDaySlots = undefined

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/activities')
      expect(res.render).not.toHaveBeenCalled()
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      mockUpdateActivity.mockResolvedValue({} as Activity)
    })

    it('should update activity and redirect with success when yes is selected', async () => {
      req.body.runSessionToday = YesNo.YES

      await handler.POST(req, res)

      expect(activitiesService.updateActivity).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          slots: req.journeyData.createJourney.customSlots,
          scheduleWeeks: 2,
          removeEndDate: false,
          firstTimeSlotForToday: 'AM',
        }),
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/view/1',
        'Activity updated',
        "You've updated the daily schedule for Test Activity",
      )
    })

    it('should update activity without firstTimeSlotForToday when no is selected', async () => {
      req.body.runSessionToday = YesNo.NO

      await handler.POST(req, res)

      expect(activitiesService.updateActivity).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          slots: req.journeyData.createJourney.customSlots,
          scheduleWeeks: 2,
          removeEndDate: false,
        }),
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/view/1',
        'Activity updated',
        "You've updated the daily schedule for Test Activity",
      )
      expect(activitiesService.updateActivity).toHaveBeenCalledWith(
        1,
        expect.not.objectContaining({
          firstTimeSlotForToday: expect.anything(),
        }),
        res.locals.user,
      )
    })

    it('should use customSlots for update when custom times are being used', async () => {
      req.body.runSessionToday = YesNo.YES
      const customSlotsArray = req.journeyData.createJourney.customSlots

      await handler.POST(req, res)

      expect(activitiesService.updateActivity).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          slots: customSlotsArray,
        }),
        res.locals.user,
      )
    })

    it('should redirect to /activities when futureSameDaySlots is empty', async () => {
      req.body.runSessionToday = YesNo.YES
      req.journeyData.createJourney.futureSameDaySlots = []

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/activities')
      expect(activitiesService.updateActivity).not.toHaveBeenCalled()
    })

    it('should redirect to /activities when futureSameDaySlots is undefined', async () => {
      req.body.runSessionToday = YesNo.YES
      req.journeyData.createJourney.futureSameDaySlots = undefined

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/activities')
      expect(activitiesService.updateActivity).not.toHaveBeenCalled()
    })

    it('should throw FormValidationError when no option is selected', async () => {
      req.body.runSessionToday = null

      await expect(handler.POST(req, res)).rejects.toThrow(FormValidationError)
      expect(activitiesService.updateActivity).not.toHaveBeenCalled()
    })

    it('should throw FormValidationError when runSessionToday is undefined', async () => {
      req.body.runSessionToday = undefined

      await expect(handler.POST(req, res)).rejects.toThrow(FormValidationError)
      expect(activitiesService.updateActivity).not.toHaveBeenCalled()
    })

    it('should set firstTimeSlotForToday to the first future slot when yes is selected', async () => {
      req.body.runSessionToday = YesNo.YES

      await handler.POST(req, res)

      expect(activitiesService.updateActivity).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          firstTimeSlotForToday: 'AM',
        }),
        res.locals.user,
      )
    })

    it('should include all custom slots including Tuesday AM in the API update call', async () => {
      req.body.runSessionToday = YesNo.YES

      await handler.POST(req, res)

      const callArgs = (activitiesService.updateActivity as jest.Mock).mock.calls[0]
      const updateRequest = callArgs[1]

      expect(updateRequest.slots).toEqual(req.journeyData.createJourney.customSlots)

      const tuesdayAmSlot = updateRequest.slots.find(
        (slot: Slot) => slot.timeSlot === 'AM' && slot.daysOfWeek.includes('TUESDAY'),
      )
      expect(tuesdayAmSlot).toBeDefined()
      expect(tuesdayAmSlot.daysOfWeek).toContain('TUESDAY')
    })

    it('should use regime time (set as slots) when not using custom slot times', async () => {
      req.body.runSessionToday = YesNo.YES
      delete req.journeyData.createJourney.customSlots

      req.journeyData.createJourney.slots = {
        '1': {
          days: ['monday', 'tuesday'],
          timeSlotsMonday: ['AM', 'PM'],
        },
      }

      await handler.POST(req, res)

      const callArgs = (activitiesService.updateActivity as jest.Mock).mock.calls[0]
      const updateRequest = callArgs[1]

      expect(updateRequest.slots).toHaveLength(2)

      expect(updateRequest.slots).toContainEqual(
        expect.objectContaining({
          timeSlot: 'AM',
          monday: true,
          weekNumber: 1,
        }),
      )
      expect(updateRequest.slots).toContainEqual(
        expect.objectContaining({
          timeSlot: 'PM',
          monday: true,
          weekNumber: 1,
        }),
      )

      expect(updateRequest.scheduleWeeks).toBe(2)
      expect(updateRequest.removeEndDate).toBe(false)
      expect(updateRequest.firstTimeSlotForToday).toBe('AM')

      expect(res.redirectWithSuccess).toHaveBeenCalled()
    })
  })
})
