import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays } from 'date-fns'
import { NextFunction } from 'express-serve-static-core'
import createHttpError from 'http-errors'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import DaysAndTimesRoutes, { DaysAndTimes } from './daysAndTimes'
import ActivitiesService from '../../../../services/activitiesService'
import { formatIsoDate } from '../../../../utils/datePickerUtils'
import { validateSlotChanges } from '../../../../utils/helpers/activityScheduleValidator'
import { Activity, Slot } from '../../../../@types/activitiesAPI/types'
import TimeSlot from '../../../../enum/timeSlot'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../utils/helpers/activityScheduleValidator')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const findActivitySlotErrorsMock = validateSlotChanges as jest.MockedFunction<typeof validateSlotChanges>

describe('Route Handlers - Create an activity schedule - Days and times', () => {
  const handler = new DaysAndTimesRoutes(activitiesService)
  let req: Request
  let res: Response
  let next: NextFunction
  const startDate = addDays(new Date(), 1)
  const endDate = addDays(new Date(), 8)

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
      addValidationError: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {
          startDate: formatIsoDate(startDate),
          endDate: formatIsoDate(endDate),
        },
      },
      body: {},
      params: {},
      query: {},
    } as unknown as Request

    next = jest.fn()

    findActivitySlotErrorsMock.mockReturnValue([])
  })

  describe('GET', () => {
    it('should render the expected view if week number is valid', async () => {
      req.session.createJourney.scheduleWeeks = 1
      req.params = {
        weekNumber: '1',
        mode: 'create',
      }

      await handler.GET(req, res, next)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/days-and-times', {
        currentWeek: null,
      })
    })

    describe('Validation', () => {
      it.each([
        ['greater than schedule weeks', '3'],
        ['less than 1', '0'],
        ['a decimal', '1.1'],
        ['not a valid number', 'invalid'],
      ])('should render 404 error if week number is %s', async (desc: string, weekNumber: string) => {
        req.session.createJourney.scheduleWeeks = 2
        req.params.weekNumber = weekNumber

        await handler.GET(req, res, next)
        expect(next).toHaveBeenCalledWith(createHttpError.NotFound())
      })

      it.each([
        ['greater than schedule weeks', '3'],
        ['less than 1', '0'],
        ['a decimal', '1.1'],
        ['not a valid number', 'invalid'],
      ])('should render 404 error if week number is %s', async (desc: string, weekNumber: string) => {
        req.session.createJourney.scheduleWeeks = 2
        req.params.weekNumber = weekNumber

        await handler.GET(req, res, next)
        expect(next).toHaveBeenCalledWith(createHttpError.NotFound())
      })
    })
  })

  describe('POST', () => {
    describe('Create journey', () => {
      beforeEach(() => {
        req.params = {
          weekNumber: '1',
          mode: 'create',
        }
        req.body = {
          days: ['tuesday', 'friday'],
          timeSlotsTuesday: ['AM'],
          timeSlotsFriday: ['PM', 'ED'],
        }
      })

      it('should save slots in session and redirect to set activity times page', async () => {
        req.session.createJourney.scheduleWeeks = 1

        await handler.POST(req, res, next)

        expect(req.session.createJourney.slots['1'].days).toEqual(['tuesday', 'friday'])
        expect(req.session.createJourney.slots['1'].timeSlotsTuesday).toEqual(['AM'])
        expect(req.session.createJourney.slots['1'].timeSlotsFriday).toEqual(['PM', 'ED'])
        expect(res.redirect).toBeCalledWith('../session-times-option/1')
      })
      it('should add the preserveHistory flag', async () => {
        req.session.createJourney.scheduleWeeks = 1
        req.query.preserveHistory = 'true'

        await handler.POST(req, res, next)

        expect(req.session.createJourney.slots['1'].days).toEqual(['tuesday', 'friday'])
        expect(req.session.createJourney.slots['1'].timeSlotsTuesday).toEqual(['AM'])
        expect(req.session.createJourney.slots['1'].timeSlotsFriday).toEqual(['PM', 'ED'])
        expect(res.redirect).toBeCalledWith('../session-times-option/1?preserveHistory=true')
      })

      it('should save slots in session and redirect to set activity times page for a single session', async () => {
        req.session.createJourney.scheduleWeeks = 1
        req.body = {
          days: ['friday'],
          timeSlotsFriday: 'PM',
        }

        await handler.POST(req, res, next)

        expect(req.session.createJourney.slots['1'].days).toEqual(['friday'])
        expect(req.session.createJourney.slots['1'].timeSlotsFriday).toEqual(['PM'])
        expect(res.redirect).toBeCalledWith('../session-times-option/1')
      })

      it('should save slots in session and redirect to days and times page (#2) if first week of bi-weekly schedule', async () => {
        req.session.createJourney.scheduleWeeks = 2

        await handler.POST(req, res, next)

        expect(req.session.createJourney.slots['1'].days).toEqual(['tuesday', 'friday'])
        expect(req.session.createJourney.slots['1'].timeSlotsTuesday).toEqual(['AM'])
        expect(req.session.createJourney.slots['1'].timeSlotsFriday).toEqual(['PM', 'ED'])
        expect(res.redirect).toBeCalledWith('2')
      })
      it('should save slots in session and redirect to session times option page if second week of bi-weekly schedule', async () => {
        req.query = {
          preserveHistory: 'true',
        }
        req.params.weekNumber = '2'
        req.session.createJourney.scheduleWeeks = 2
        req.session.createJourney.slots = {
          '1': {
            days: ['tuesday', 'friday'],
            timeSlotsTuesday: ['AM'],
            timeSlotsFriday: ['PM', 'ED'],
          },
        }

        req.body = {
          days: ['monday'],
          timeSlotsMonday: ['AM'],
        }

        await handler.POST(req, res, next)

        expect(req.session.createJourney.slots['2'].days).toEqual(['monday'])
        expect(req.session.createJourney.slots['2'].timeSlotsMonday).toEqual(['AM'])
        expect(res.redirect).toBeCalledWith(`../session-times-option/2?preserveHistory=true`)
      })

      describe('Change data from check answers page', () => {
        beforeEach(() => {
          req.params = {
            weekNumber: '1',
            mode: 'create',
          }
          req.query = {
            preserveHistory: 'true',
          }
        })

        describe("Change a week's slots", () => {
          it('should save slots in session and redirect to session times option if first week of bi-weekly schedule and using custom times', async () => {
            const customSlots: Slot[] = [
              {
                customStartTime: '05:30',
                customEndTime: '09:45',
                daysOfWeek: ['TUESDAY'],
                friday: false,
                monday: false,
                saturday: false,
                sunday: false,
                thursday: false,
                timeSlot: TimeSlot.AM,
                tuesday: true,
                wednesday: false,
                weekNumber: 1,
              },
              {
                customStartTime: '15:45',
                customEndTime: '17:41',
                daysOfWeek: ['FRIDAY'],
                friday: true,
                monday: false,
                saturday: false,
                sunday: false,
                thursday: false,
                timeSlot: TimeSlot.PM,
                tuesday: false,
                wednesday: false,
                weekNumber: 1,
              },
              {
                customStartTime: '19:34',
                customEndTime: '21:22',
                daysOfWeek: ['FRIDAY'],
                friday: true,
                monday: false,
                saturday: false,
                sunday: false,
                thursday: false,
                timeSlot: TimeSlot.ED,
                tuesday: false,
                wednesday: false,
                weekNumber: 1,
              },
            ]

            req.session.createJourney.scheduleWeeks = 2
            req.session.createJourney.customSlots = customSlots

            await handler.POST(req, res, next)

            expect(req.session.createJourney.slots['1'].days).toEqual(['tuesday', 'friday'])
            expect(req.session.createJourney.slots['1'].timeSlotsTuesday).toEqual(['AM'])
            expect(req.session.createJourney.slots['1'].timeSlotsFriday).toEqual(['PM', 'ED'])
            expect(req.session.createJourney.customSlots).toEqual(customSlots)
            expect(res.redirect).toHaveBeenCalledWith('../session-times-option/1?preserveHistory=true')
          })
        })

        describe('Change to weekly schedule frequency', () => {
          beforeEach(() => {
            req.session.createJourney.scheduleWeeks = 1

            req.query = {
              preserveHistory: 'true',
              fromScheduleFrequency: 'true',
            }
          })

          it('should save slots in session and redirect to set activity times page', async () => {
            req.params = {
              weekNumber: '1',
            }

            await handler.POST(req, res, next)

            expect(req.session.createJourney.slots['1'].days).toEqual(['tuesday', 'friday'])
            expect(req.session.createJourney.slots['1'].timeSlotsTuesday).toEqual(['AM'])
            expect(req.session.createJourney.slots['1'].timeSlotsFriday).toEqual(['PM', 'ED'])
            expect(res.redirect).toBeCalledWith('../session-times-option/1?preserveHistory=true')
          })

          it('should move to the second week of two weeks when changed to no days selected', async () => {
            req.session.createJourney.scheduleWeeks = 2
            req.session.createJourney.slots = {
              '1': {
                days: ['tuesday', 'friday'],
                timeSlotsTuesday: ['AM'],
                timeSlotsFriday: ['PM', 'ED'],
              },
            }
            req.params = {
              weekNumber: '1',
            }
            req.query.preserveHistory = undefined
            req.body.days = undefined

            await handler.POST(req, res, next)

            expect(req.session.createJourney.slots).toEqual({
              '1': {
                days: [],
              },
            })
            expect(res.redirect).toBeCalledWith('2')
          })
        })

        describe('Change to bi-weekly schedule frequency', () => {
          beforeEach(() => {
            req.session.createJourney.scheduleWeeks = 2

            req.params = {
              mode: 'create',
            }

            req.query = {
              preserveHistory: 'true',
              fromScheduleFrequency: 'true',
            }
          })

          it("should save slots in session and redirect to next week's slots if not last week in schedule", async () => {
            req.params = {
              weekNumber: '1',
            }

            await handler.POST(req, res, next)

            expect(req.session.createJourney.slots['1'].days).toEqual(['tuesday', 'friday'])
            expect(req.session.createJourney.slots['1'].timeSlotsTuesday).toEqual(['AM'])
            expect(req.session.createJourney.slots['1'].timeSlotsFriday).toEqual(['PM', 'ED'])
            expect(res.redirect).toHaveBeenCalledWith('2?preserveHistory=true&fromScheduleFrequency=true')
          })

          it('should save slots to session and redirect back to session times option page if last week in schedule', async () => {
            req.params = {
              weekNumber: '2',
            }

            await handler.POST(req, res, next)

            expect(req.session.createJourney.slots['2'].days).toEqual(['tuesday', 'friday'])
            expect(req.session.createJourney.slots['2'].timeSlotsTuesday).toEqual(['AM'])
            expect(req.session.createJourney.slots['2'].timeSlotsFriday).toEqual(['PM', 'ED'])
            expect(res.redirect).toHaveBeenCalledWith(
              '../session-times-option/2?preserveHistory=true&fromScheduleFrequency=true',
            )
          })
        })
      })
    })

    describe("Edit a week's slots from activity details page", () => {
      it('should save slots when editing existing activity - using regime times - week 1 of 2', async () => {
        req = {
          session: {
            createJourney: {
              activityId: 1,
              name: 'Maths level 1',
              slots: {},
              scheduleWeeks: 2,
            },
          },
          params: {
            weekNumber: '1',
            mode: 'edit',
          },
          query: {
            preserveHistory: 'true',
          },
          body: {
            days: ['tuesday', 'friday'],
            timeSlotsTuesday: ['AM'],
            timeSlotsFriday: ['PM', 'ED'],
          },
        } as unknown as Request

        const activityFromApi = {
          id: 1,
          schedules: [
            {
              usePrisonRegimeTime: true,
              slots: [
                {
                  id: 5,
                  weekNumber: 1,
                  timeSlot: 'AM',
                  startTime: '8:30',
                  endTime: '11:45',
                  daysOfWeek: ['Tue'],
                  mondayFlag: false,
                  tuesdayFlag: true,
                  wednesdayFlag: false,
                  thursdayFlag: false,
                  fridayFlag: false,
                  saturdayFlag: false,
                  sundayFlag: false,
                },
              ],
            },
          ],
        } as Activity

        activitiesService.getActivity.mockReturnValue(Promise.resolve(activityFromApi))

        await handler.POST(req, res, next)

        const expectedActivityUpdate = {
          scheduleWeeks: 2,
          slots: [
            { weekNumber: 1, timeSlot: 'AM', tuesday: true },
            { weekNumber: 1, timeSlot: 'PM', friday: true },
            { weekNumber: 1, timeSlot: 'ED', friday: true },
          ],
        }

        expect(activitiesService.updateActivity).toHaveBeenCalledWith(
          req.session.createJourney.activityId,
          expectedActivityUpdate,
          res.locals.user,
        )

        expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
          '/activities/view/1',
          'Activity updated',
          "You've updated the daily schedule for Maths level 1",
        )
      })
      it('should save slots when editing existing activity - using regime times - week 2 of 2', async () => {
        req = {
          session: {
            createJourney: {
              activityId: 1,
              name: 'Maths level 1',
              slots: {},
              scheduleWeeks: 2,
            },
          },
          params: {
            weekNumber: '2',
            mode: 'edit',
          },
          query: {
            preserveHistory: 'true',
          },
          body: {
            days: ['tuesday', 'friday'],
            timeSlotsTuesday: ['AM'],
            timeSlotsFriday: ['PM', 'ED'],
          },
        } as unknown as Request

        const activityFromApi = {
          id: 1,
          schedules: [
            {
              usePrisonRegimeTime: true,
              slots: [
                {
                  id: 5,
                  weekNumber: 2,
                  timeSlot: 'AM',
                  startTime: '8:30',
                  endTime: '11:45',
                  daysOfWeek: ['Tue'],
                  mondayFlag: false,
                  tuesdayFlag: true,
                  wednesdayFlag: false,
                  thursdayFlag: false,
                  fridayFlag: false,
                  saturdayFlag: false,
                  sundayFlag: false,
                },
              ],
            },
          ],
        } as Activity

        activitiesService.getActivity.mockReturnValue(Promise.resolve(activityFromApi))

        await handler.POST(req, res, next)

        const expectedActivityUpdate = {
          scheduleWeeks: 2,
          slots: [
            { weekNumber: 2, timeSlot: 'AM', tuesday: true },
            { weekNumber: 2, timeSlot: 'PM', friday: true },
            { weekNumber: 2, timeSlot: 'ED', friday: true },
          ],
        }

        expect(activitiesService.updateActivity).toHaveBeenCalledWith(
          req.session.createJourney.activityId,
          expectedActivityUpdate,
          res.locals.user,
        )

        expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
          '/activities/view/1',
          'Activity updated',
          "You've updated the daily schedule for Maths level 1",
        )
      })
      it('should save slots when editing existing activity - regime slots being used - 1 week only', async () => {
        const activityFromApi = {
          id: 1,
          schedules: [
            {
              usePrisonRegimeTime: true,
              slots: [
                {
                  id: 5,
                  weekNumber: 1,
                  timeSlot: 'AM',
                  startTime: '10:00',
                  endTime: '11:00',
                  daysOfWeek: ['Tue'],
                  mondayFlag: false,
                  tuesdayFlag: true,
                  wednesdayFlag: false,
                  thursdayFlag: false,
                  fridayFlag: false,
                  saturdayFlag: false,
                  sundayFlag: false,
                },
              ],
            },
          ],
        } as Activity

        activitiesService.getActivity.mockReturnValue(Promise.resolve(activityFromApi))

        req = {
          session: {
            createJourney: {
              activityId: 1,
              name: 'Maths level 1',
              slots: {},
              scheduleWeeks: 1,
            },
          },
          params: {
            weekNumber: '1',
            mode: 'edit',
          },
          query: {
            preserveHistory: 'true',
          },
          body: {
            days: ['tuesday', 'friday'],
            timeSlotsTuesday: ['AM'],
            timeSlotsFriday: ['PM', 'ED'],
          },
        } as unknown as Request

        await handler.POST(req, res, next)

        expect(activitiesService.updateActivity).toHaveBeenCalledWith(
          1,
          {
            scheduleWeeks: 1,
            slots: [
              { tuesday: true, timeSlot: 'AM', weekNumber: 1 },
              { friday: true, timeSlot: 'PM', weekNumber: 1 },
              { friday: true, timeSlot: 'ED', weekNumber: 1 },
            ],
          },
          { activeCaseLoadId: 'MDI', username: 'joebloggs' },
        )

        expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
          '/activities/view/1',
          'Activity updated',
          "You've updated the daily schedule for Maths level 1",
        )
      })
      it('should save slots when editing existing activity - custom slots being used - 1 week only', async () => {
        const activityFromApi = {
          id: 1,
          schedules: [
            {
              usePrisonRegimeTime: false,
              slots: [
                {
                  id: 5,
                  weekNumber: 1,
                  timeSlot: 'AM',
                  startTime: '10:00',
                  endTime: '11:00',
                  daysOfWeek: ['Tue'],
                  mondayFlag: false,
                  tuesdayFlag: true,
                  wednesdayFlag: false,
                  thursdayFlag: false,
                  fridayFlag: false,
                  saturdayFlag: false,
                  sundayFlag: false,
                },
              ],
            },
          ],
        } as Activity

        activitiesService.getActivity.mockReturnValue(Promise.resolve(activityFromApi))

        req = {
          session: {
            createJourney: {
              activityId: 1,
              name: 'Maths level 1',
              slots: {},
              scheduleWeeks: 1,
            },
          },
          params: {
            weekNumber: '1',
            mode: 'edit',
          },
          query: {
            preserveHistory: 'true',
          },
          body: {
            days: ['tuesday', 'friday'],
            timeSlotsTuesday: ['AM'],
            timeSlotsFriday: ['PM', 'ED'],
          },
        } as unknown as Request

        await handler.POST(req, res, next)

        expect(res.redirect).toHaveBeenCalledWith('../session-times')
      })
      it('should redirect to session-times page if preserveHistory is true, fromScheduleFrequency is false, custom times are being used - week 1 of 2', async () => {
        const activityFromApi = {
          id: 1,
          schedules: [
            {
              usePrisonRegimeTime: false,
              slots: [
                {
                  id: 5,
                  weekNumber: 1,
                  timeSlot: 'AM',
                  startTime: '10:00',
                  endTime: '11:00',
                  daysOfWeek: ['Tue'],
                  mondayFlag: false,
                  tuesdayFlag: true,
                  wednesdayFlag: false,
                  thursdayFlag: false,
                  fridayFlag: false,
                  saturdayFlag: false,
                  sundayFlag: false,
                },
              ],
            },
          ],
        } as Activity

        activitiesService.getActivity.mockReturnValue(Promise.resolve(activityFromApi))

        req = {
          session: {
            createJourney: {
              activityId: 1,
              name: 'Maths level 1',
              slots: {},
              scheduleWeeks: 2,
            },
          },
          query: {
            preserveHistory: 'true',
            fromScheduleFrequency: 'false',
          },
          params: {
            weekNumber: '1',
            mode: 'edit',
          },
          body: {
            days: ['tuesday', 'friday'],
            timeSlotsTuesday: ['AM'],
            timeSlotsFriday: ['PM', 'ED'],
          },
        } as unknown as Request

        await handler.POST(req, res, next)

        expect(res.redirect).toHaveBeenCalledWith('../session-times')
      })
      it('should redirect to session-times page if preserveHistory is true, fromScheduleFrequency is false, custom times are being used - week 2 of 2', async () => {
        const activityFromApi = {
          id: 1,
          schedules: [
            {
              usePrisonRegimeTime: false,
              slots: [
                {
                  id: 5,
                  weekNumber: 2,
                  timeSlot: 'AM',
                  startTime: '10:00',
                  endTime: '11:00',
                  daysOfWeek: ['Tue'],
                  mondayFlag: false,
                  tuesdayFlag: true,
                  wednesdayFlag: false,
                  thursdayFlag: false,
                  fridayFlag: false,
                  saturdayFlag: false,
                  sundayFlag: false,
                },
              ],
            },
          ],
        } as Activity

        activitiesService.getActivity.mockReturnValue(Promise.resolve(activityFromApi))

        req = {
          session: {
            createJourney: {
              activityId: 1,
              name: 'Maths level 1',
              slots: {},
              scheduleWeeks: 2,
            },
          },
          query: {
            preserveHistory: 'true',
            fromScheduleFrequency: 'false',
          },
          params: {
            weekNumber: '2',
            mode: 'edit',
          },
          body: {
            days: ['tuesday', 'friday'],
            timeSlotsTuesday: ['AM'],
            timeSlotsFriday: ['PM', 'ED'],
          },
        } as unknown as Request

        await handler.POST(req, res, next)

        expect(res.redirect).toHaveBeenCalledWith('../session-times')
      })

      it.each([
        ['greater than schedule weeks', '3'],
        ['less than 1', '0'],
        ['a decimal', '1.1'],
        ['not a valid number', 'invalid'],
      ])('should render 404 error if week number is %s', async (desc: string, weekNumber: string) => {
        req.session.createJourney.scheduleWeeks = 2
        req.params.weekNumber = weekNumber

        await handler.POST(req, res, next)
        expect(next).toHaveBeenCalledWith(createHttpError.NotFound())
      })
    })

    describe('type validation', () => {
      it('validation fails if no slots selected for a day', async () => {
        const body = {
          days: ['tuesday', 'friday'],
          timeSlotsFriday: ['PM', 'ED'],
        }

        const requestObject = plainToInstance(DaysAndTimes, body)
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual([{ property: 'timeSlotsTuesday', error: 'Select at least one time slot for Tuesday' }])
      })
    })

    describe('slots validation', () => {
      it('validation fails if any slots are outside date range', async () => {
        req.session.createJourney.scheduleWeeks = 1
        req.params = {
          weekNumber: '1',
        }
        req.body = {
          days: ['tuesday', 'friday'],
          timeSlotsTuesday: ['AM'],
          timeSlotsFriday: ['PM', 'ED'],
        }

        findActivitySlotErrorsMock.mockReturnValue([{ weekNumber: 1, day: 'Monday' }])

        await handler.POST(req, res, next)

        const startDateStr = formatDate(startDate)
        const endDateStr = formatDate(endDate)
        expect(res.addValidationError).toBeCalledTimes(1)
        expect(res.addValidationError).toHaveBeenCalledWith(
          'timeSlotsMonday',
          `You cannot select Monday. This is because the activity starts on ${startDateStr} and ends on ${endDateStr}`,
        )
        expect(res.validationFailed).toBeCalledTimes(1)
      })

      it('validation fails if any slots are outside date range second week', async () => {
        req.session.createJourney.scheduleWeeks = 2
        req.params = {
          weekNumber: '2',
        }
        req.body = {
          days: ['tuesday', 'friday'],
          timeSlotsTuesday: ['AM'],
          timeSlotsFriday: ['PM', 'ED'],
        }

        findActivitySlotErrorsMock.mockReturnValue([{ weekNumber: 2, day: 'Monday' }])

        await handler.POST(req, res, next)

        const startDateStr = formatDate(startDate)
        const endDateStr = formatDate(endDate)
        expect(res.addValidationError).toBeCalledTimes(1)
        expect(res.addValidationError).toHaveBeenCalledWith(
          'timeSlotsMonday',
          `You cannot select Monday. As this activity starts on ${startDateStr} and ends on ${endDateStr}, there cannot be a Monday session in week 2`,
        )
        expect(res.validationFailed).toBeCalledTimes(1)
      })

      it('validation fails if no slots are selected', async () => {
        req.session.createJourney.scheduleWeeks = 1
        req.params = {
          weekNumber: '1',
        }
        req.body = {
          days: undefined,
        }

        await handler.POST(req, res, next)

        expect(res.validationFailed).toBeCalledTimes(1)
        expect(res.validationFailed).toHaveBeenCalledWith('days', `You must select at least 1 slot across the schedule`)
        expect(res.validationFailed).toBeCalledTimes(1)
      })
    })
  })
})
