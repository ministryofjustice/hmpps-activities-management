import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import NotAttendedReasonRoutes, { NotAttendedForm } from './notAttendedReason'
import { AttendanceReason, ScheduledActivity } from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'
import AttendanceReasons from '../../../../enum/attendanceReason'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import TimeSlot from '../../../../enum/timeSlot'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null)

describe('Route Handlers - Non Attendance', () => {
  const handler = new NotAttendedReasonRoutes(activitiesService)

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
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      journeyData: {
        recordAttendanceJourney: {
          notAttended: {
            selectedPrisoners: [
              {
                instanceId: 1,
                attendanceId: 1,
                prisonerNumber: 'ABC123',
                prisonerName: 'JOE BLOGGS',
                firstName: 'JOE',
                lastName: 'BLOGGS',
              },
              {
                instanceId: 2,
                attendanceId: 2,
                prisonerNumber: 'ABC123',
                prisonerName: 'JOE BLOGGS',
                firstName: 'JOE',
                lastName: 'BLOGGS',
              },
              {
                instanceId: 2,
                attendanceId: 3,
                prisonerNumber: 'XYZ123',
                prisonerName: 'MARY SMITH',
                firstName: 'MARY',
                lastName: 'SMITH',
              },
            ],
          },
        },
      },
      body: plainToInstance(NotAttendedForm, {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'JOE BLOGGS',
            firstName: 'JOE',
            lastName: 'BLOGGS',
            notAttendedReason: AttendanceReasons.SICK,
            moreDetail: '',
            caseNote: '',
            otherAbsenceReason: '',
            sickPay: YesNo.YES,
            isPayable: true,
          },
          {
            instanceId: 2,
            prisonerNumber: 'ABC123',
            prisonerName: 'JOE BLOGGS',
            firstName: 'JOE',
            lastName: 'BLOGGS',
            notAttendedReason: AttendanceReasons.OTHER,
            moreDetail: '',
            caseNote: '',
            otherAbsenceReason: 'Refusal',
            sickPay: YesNo.YES,
            isPayable: false,
          },
          {
            instanceId: 2,
            prisonerNumber: 'XYZ123',
            prisonerName: 'MARY SMITH',
            firstName: 'MARY',
            lastName: 'SMITH',
            notAttendedReason: AttendanceReasons.REFUSED,
            moreDetail: '',
            caseNote: 'Blah Blah',
            otherAbsenceReason: '',
            sickPay: YesNo.YES,
            isPayable: false,
          },
        ],
      }),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render with the expected single view', async () => {
      req = {
        journeyData: {
          recordAttendanceJourney: {
            notAttended: {
              selectedPrisoners: [
                {
                  instanceId: 1,
                  attendanceId: 1,
                  prisonerNumber: 'ABC123',
                  prisonerName: 'JOE BLOGGS',
                  firstName: 'JOE',
                  lastName: 'BLOGGS',
                },
              ],
            },
          },
        },
        body: plainToInstance(NotAttendedForm, {
          notAttendedData: [
            {
              instanceId: 1,
              prisonerNumber: 'ABC123',
              prisonerName: 'JOE BLOGGS',
              firstName: 'JOE',
              lastName: 'BLOGGS',
              notAttendedReason: AttendanceReasons.SICK,
              moreDetail: '',
              caseNote: '',
              otherAbsenceReason: '',
              sickPay: YesNo.YES,
              isPayable: true,
            },
          ],
        }),
      } as unknown as Request

      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          id: 1,
          startTime: '09:00',
          timeSlot: TimeSlot.AM,
          activitySchedule: {
            id: 2,
            activity: {
              id: 2,
              summary: 'Maths 1',
              paid: true,
            },
          },
        } as ScheduledActivity)

      when(activitiesService.getAttendanceReasons)
        .calledWith(res.locals.user)
        .mockResolvedValue([
          {
            id: 1,
            code: 'SICK',
            description: 'Sickness',
            attended: false,
            capturePay: true,
            captureMoreDetail: true,
            captureCaseNote: false,
            captureIncentiveLevelWarning: false,
            captureOtherText: false,
            displaySequence: 1,
            displayInAbsence: true,
          },
        ] as AttendanceReason[])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/not-attended-reason', {
        notAttendedReasons: [
          {
            id: 1,
            code: 'SICK',
            description: 'Sickness',
            attended: false,
            capturePay: true,
            captureMoreDetail: true,
            captureCaseNote: false,
            captureIncentiveLevelWarning: false,
            captureOtherText: false,
            displaySequence: 1,
            displayInAbsence: true,
          },
        ],
        rows: [
          {
            instanceId: 1,
            attendanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'JOE BLOGGS',
            firstName: 'JOE',
            lastName: 'BLOGGS',
            session: 'AM',
            activityName: 'Maths 1',
            isPayable: true,
          },
        ],
      })
    })

    it('should render with the expected multiple view', async () => {
      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          id: 1,
          startTime: '09:00',
          timeSlot: TimeSlot.AM,
          activitySchedule: {
            id: 2,
            activity: {
              id: 2,
              summary: 'Maths 1',
              paid: true,
            },
          },
        } as ScheduledActivity)

      when(activitiesService.getScheduledActivity)
        .calledWith(2, res.locals.user)
        .mockResolvedValue({
          id: 2,
          startTime: '09:00',
          timeSlot: TimeSlot.AM,
          activitySchedule: {
            id: 3,
            activity: {
              id: 4,
              summary: 'English 1',
              paid: false,
            },
          },
        } as ScheduledActivity)

      when(activitiesService.getAttendanceReasons)
        .calledWith(res.locals.user)
        .mockResolvedValue([
          {
            id: 1,
            code: 'SICK',
            description: 'Sickness',
            attended: false,
            capturePay: true,
            captureMoreDetail: true,
            captureCaseNote: false,
            captureIncentiveLevelWarning: false,
            captureOtherText: false,
            displaySequence: 1,
            displayInAbsence: true,
          },
          {
            id: 2,
            code: 'ATTENDED',
            description: 'Attended',
            attended: true,
            capturePay: false,
            captureMoreDetail: false,
            captureCaseNote: false,
            captureIncentiveLevelWarning: false,
            captureOtherText: false,
            displaySequence: 2,
            displayInAbsence: false,
          },
        ] as AttendanceReason[])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/not-attended-reason-multiple', {
        notAttendedReasons: [
          {
            id: 1,
            code: 'SICK',
            description: 'Sickness',
            attended: false,
            capturePay: true,
            captureMoreDetail: true,
            captureCaseNote: false,
            captureIncentiveLevelWarning: false,
            captureOtherText: false,
            displaySequence: 1,
            displayInAbsence: true,
          },
        ],
        rows: [
          {
            instanceId: 1,
            attendanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'JOE BLOGGS',
            firstName: 'JOE',
            lastName: 'BLOGGS',
            session: 'AM',
            activityName: 'Maths 1',
            isPayable: true,
          },
          {
            instanceId: 2,
            attendanceId: 2,
            prisonerNumber: 'ABC123',
            prisonerName: 'JOE BLOGGS',
            firstName: 'JOE',
            lastName: 'BLOGGS',
            session: 'AM',
            activityName: 'English 1',
            isPayable: false,
          },
          {
            instanceId: 2,
            attendanceId: 3,
            prisonerNumber: 'XYZ123',
            prisonerName: 'MARY SMITH',
            firstName: 'MARY',
            lastName: 'SMITH',
            session: 'AM',
            activityName: 'English 1',
            isPayable: false,
          },
        ],
      })
    })
  })

  describe('POST_MULTIPLE', () => {
    it('should redirect to attendance dashboard when not attended journey data is not available', async () => {
      req.journeyData.recordAttendanceJourney.notAttended = undefined
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('/activities/attendance')
    })
    it.each([
      [true, '1/attendance-list'],
      [false, 'attendance-list'],
    ])(
      'non-attendance should be redirected to the non-attendance reason page and singleInstanceSelected = %s',
      async (singleInstanceSelected: boolean, url: string) => {
        req.journeyData.recordAttendanceJourney.singleInstanceSelected = singleInstanceSelected

        when(activitiesService.getScheduledActivity)
          .calledWith(1, res.locals.user)
          .mockResolvedValue({
            id: 1,
            startTime: '09:00',
            timeSlot: TimeSlot.AM,
            activitySchedule: {
              id: 2,
              activity: {
                id: 2,
                summary: 'Maths 1',
                paid: true,
              },
            },
          } as ScheduledActivity)

        when(activitiesService.getScheduledActivity)
          .calledWith(2, res.locals.user)
          .mockResolvedValue({
            id: 2,
            startTime: '09:00',
            timeSlot: TimeSlot.AM,
            activitySchedule: {
              id: 3,
              activity: {
                id: 4,
                summary: 'English 1',
                paid: false,
              },
            },
          } as ScheduledActivity)

        await handler.POST(req, res)

        expect(activitiesService.updateAttendances).toHaveBeenCalledWith(
          [
            {
              id: 1,
              prisonCode: 'MDI',
              status: AttendanceStatus.COMPLETED,
              attendanceReason: AttendanceReasons.SICK,
              incentiveLevelWarningIssued: false,
              issuePayment: true,
              comment: '',
              caseNote: null,
              otherAbsenceReason: null,
            },
            {
              id: 2,
              prisonCode: 'MDI',
              status: AttendanceStatus.COMPLETED,
              attendanceReason: AttendanceReasons.OTHER,
              incentiveLevelWarningIssued: false,
              issuePayment: false,
              comment: null,
              caseNote: null,
              otherAbsenceReason: 'Refusal',
            },
            {
              id: 3,
              prisonCode: 'MDI',
              status: AttendanceStatus.COMPLETED,
              attendanceReason: AttendanceReasons.REFUSED,
              incentiveLevelWarningIssued: false,
              issuePayment: false,
              comment: null,
              caseNote: 'Blah Blah',
              otherAbsenceReason: null,
            },
          ],
          res.locals.user,
        )
        expect(res.redirectWithSuccess).toHaveBeenCalledWith(
          `${url}`,
          'Attendance recorded',
          "You've saved attendance details for 3 attendees",
        )
      },
    )
  })

  describe('Validation', () => {
    it('should pass validation', async () => {
      const requestData = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.SICK,
            sickPay: YesNo.YES,
          },
          {
            instanceId: 2,
            prisonerNumber: 'ABC234',
            prisonerName: 'John Smith',
            firstName: 'John',
            lastName: 'Smith',
            isPayable: true,
            notAttendedReason: AttendanceReasons.SICK,
            sickPay: YesNo.NO,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, requestData)
      const errors = await validate(requestObject)
      expect(errors.length).toEqual(0)
    })

    it('should fail validation if no instance id provided', async () => {
      const badRequest = {
        notAttendedData: [
          {
            prisonerNumber: 'ABC234',
            prisonerName: 'John Smith',
            isPayable: true,
            notAttendedReason: AttendanceReasons.SICK,
            sickPay: YesNo.NO,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject).then(errs =>
        errs[0]?.children[0]?.children.flatMap(associateErrorsWithProperty),
      )
      expect(errors.length).toEqual(1)
      expect(errors[0]).toEqual({
        property: 'instanceId',
        error: 'instanceId must be a positive number',
      })
    })

    it('should fail validation if no attendance reason provided', async () => {
      const badRequest = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject).then(errs =>
        errs[0]?.children[0]?.children.flatMap(associateErrorsWithProperty),
      )
      expect(errors.length).toEqual(1)
      expect(errors[0]).toEqual({
        property: 'notAttendedReason',
        error: 'Select an absence reason for Joe Bloggs',
      })
    })

    it('should fail validation if an invalid reason is provided', async () => {
      const badRequest = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            notAttendedReason: 'INVALID',
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject).then(errs =>
        errs[0]?.children[0]?.children.flatMap(associateErrorsWithProperty),
      )
      expect(errors.length).toEqual(1)
      expect(errors[0]).toEqual({
        property: 'notAttendedReason',
        error: 'Select an absence reason for Joe Bloggs',
      })
    })

    it('should fail validation if attendance reason is "SICK" and pay not selected', async () => {
      const badRequest = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.SICK,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject).then(errs =>
        errs[0]?.children[0]?.children.flatMap(associateErrorsWithProperty),
      )
      expect(errors.length).toEqual(1)
      expect(errors[0]).toEqual({
        property: 'sickPay',
        error: 'Select if Joe Bloggs should be paid',
      })
    })

    it('should fail validation if attendance reason is "REST" and pay not selected', async () => {
      const badRequest = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.REST,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject).then(errs =>
        errs[0]?.children[0]?.children.flatMap(associateErrorsWithProperty),
      )
      expect(errors.length).toEqual(1)
      expect(errors[0]).toEqual({
        property: 'restPay',
        error: 'Select if Joe Bloggs should be paid',
      })
    })

    it('should fail validation if attendance reason is "OTHER" and pay not selected', async () => {
      const badRequest = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.OTHER,
            otherAbsenceReason: 'absence reason',
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject).then(errs =>
        errs[0]?.children[0]?.children.flatMap(associateErrorsWithProperty),
      )
      expect(errors.length).toEqual(1)
      expect(errors[0]).toEqual({
        property: 'otherAbsencePay',
        error: 'Select if this is an acceptable absence for Joe Bloggs and they should be paid',
      })
    })

    it('should pass validation and not require pay selection if attendance reason is "SICK" and activity is unpaid', async () => {
      const badRequest = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'false',
            notAttendedReason: AttendanceReasons.SICK,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject)
      expect(errors.length).toEqual(0)
    })

    it('should pass validation and not require pay selection if attendance reason is "REST" and activity is unpaid', async () => {
      const badRequest = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'false',
            notAttendedReason: AttendanceReasons.REST,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject)
      expect(errors.length).toEqual(0)
    })

    it('should pass validation and not require pay selection if attendance reason is "OTHER" and activity is unpaid', async () => {
      const badRequest = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'false',
            notAttendedReason: AttendanceReasons.SICK,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject)
      expect(errors.length).toEqual(0)
    })

    it('should fail validation if attendance reason is "OTHER" and other absence reason not entered', async () => {
      const badRequest = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.OTHER,
            otherAbsenceReason: '',
            otherAbsencePay: YesNo.YES,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject).then(errs =>
        errs[0]?.children[0]?.children.flatMap(associateErrorsWithProperty),
      )
      expect(errors.length).toEqual(1)
      expect(errors[0]).toEqual({
        property: 'otherAbsenceReason',
        error: 'Enter an absence reason for Joe Bloggs',
      })
    })

    it('should fail validation if attendance reason is "OTHER" and other absence reason exceeds 100 characters', async () => {
      const badRequest = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.OTHER,
            otherAbsenceReason: 'a'.repeat(101),
            otherAbsencePay: YesNo.YES,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject).then(errs =>
        errs[0]?.children[0]?.children.flatMap(associateErrorsWithProperty),
      )
      expect(errors.length).toEqual(1)
      expect(errors[0]).toEqual({
        property: 'otherAbsenceReason',
        error: 'Absence reason must be 100 characters or less',
      })
    })

    it('should fail validation if attendance reason is "SICK" and more details exceed 100 characters', async () => {
      const badRequest = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.SICK,
            sickPay: YesNo.YES,
            moreDetail: 'a'.repeat(101),
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject).then(errs =>
        errs[0]?.children[0]?.children.flatMap(associateErrorsWithProperty),
      )
      expect(errors.length).toEqual(1)
      expect(errors[0]).toEqual({
        property: 'moreDetail',
        error: 'Additional details must be 100 characters or less',
      })
    })

    it('should fail validation if attendance reason is "REFUSED" and case note not entered', async () => {
      const badRequest = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.REFUSED,
            incentiveLevelWarningIssued: YesNo.YES,
            caseNote: '',
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject).then(errs =>
        errs[0]?.children[0]?.children.flatMap(associateErrorsWithProperty),
      )
      expect(errors.length).toEqual(1)
      expect(errors[0]).toEqual({
        property: 'caseNote',
        error: 'Enter a case note for Joe Bloggs',
      })
    })

    it('should fail validation if attendance reason is "REFUSED" and case note exceeds 4000 characters', async () => {
      const badRequest = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.REFUSED,
            incentiveLevelWarningIssued: YesNo.YES,
            caseNote: 'a'.repeat(4001),
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject).then(errs =>
        errs[0]?.children[0]?.children.flatMap(associateErrorsWithProperty),
      )
      expect(errors.length).toEqual(1)
      expect(errors[0]).toEqual({
        property: 'caseNote',
        error: 'Case note must be 3800 characters or less',
      })
    })

    it('should fail validation if attendance reason is "REFUSED" and incentive level warning not selected', async () => {
      const badRequest = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.REFUSED,
            caseNote: 'case note',
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject).then(errs =>
        errs[0]?.children[0]?.children.flatMap(associateErrorsWithProperty),
      )
      expect(errors.length).toEqual(1)
      expect(errors[0]).toEqual({
        property: 'incentiveLevelWarningIssued',
        error: 'Select if there should be an incentive level warning for Joe Bloggs',
      })
    })

    it('should set case note when attendance reason is "REFUSED" and location is undefined', async () => {
      const request = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.REFUSED,
            caseNote: 'case note',
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, request)
      expect(requestObject.notAttendedData[0].caseNote).toEqual('case note')
    })

    it('should not issue payment if attendance reason is "REFUSED"', async () => {
      const request = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.REFUSED,
            sickPay: YesNo.YES,
            restPay: YesNo.YES,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, request)
      expect(requestObject.notAttendedData[0].getIssuePayment()).toEqual(false)
    })

    it('should always issue payment if attendance reason is "CLASH"', async () => {
      const request = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.CLASH,
            sickPay: YesNo.NO,
            restPay: YesNo.NO,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, request)
      expect(requestObject.notAttendedData[0].getIssuePayment()).toEqual(true)
    })

    it('should always issue payment if attendance reason is "NOT_REQUIRED"', async () => {
      const request = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.NOT_REQUIRED,
            sickPay: YesNo.NO,
            restPay: YesNo.NO,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, request)
      expect(requestObject.notAttendedData[0].getIssuePayment()).toEqual(true)
    })

    it('should not issue payment if attendance reason is "SICK" and sick pay not selected', async () => {
      const request = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.SICK,
            sickPay: YesNo.NO,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, request)
      expect(requestObject.notAttendedData[0].getIssuePayment()).toEqual(false)
    })

    it('should not issue payment if attendance reason is "OTHER" and not acceptable', async () => {
      const request = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.OTHER,
            otherAbsencePay: YesNo.NO,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, request)
      expect(requestObject.notAttendedData[0].getIssuePayment()).toEqual(false)
    })

    it('should not issue payment if attendance reason is "OTHER" and acceptable', async () => {
      const request = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.OTHER,
            otherAbsencePay: YesNo.YES,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, request)
      expect(requestObject.notAttendedData[0].getIssuePayment()).toEqual(true)
    })

    it('should not issue payment if attendance reason is "REST" and rest pay not selected', async () => {
      const request = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.REST,
            restPay: YesNo.NO,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, request)
      expect(requestObject.notAttendedData[0].getIssuePayment()).toEqual(false)
    })

    it('should not issue incentive level warning if attendance reason is not "REFUSED"', async () => {
      const request = {
        notAttendedData: [
          {
            instanceId: 1,
            prisonerNumber: 'ABC123',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            isPayable: 'true',
            notAttendedReason: AttendanceReasons.SICK,
            incentiveLevelWarningIssued: YesNo.YES,
          },
        ],
      }

      const requestObject = plainToInstance(NotAttendedForm, request)
      expect(requestObject.notAttendedData[0].getIncentiveLevelWarning()).toEqual(false)
    })
  })
})
