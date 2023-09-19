import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import NotAttendedReasonRoutes, { NotAttendedData, NotAttendedForm } from './notAttendedReason'
import { AttendanceReason, AttendanceUpdateRequest } from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'
import AttendanceReasons from '../../../../enum/attendanceReason'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import AttendanceStatus from '../../../../enum/attendanceStatus'

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
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: { id: 1 },
      session: {
        notAttendedJourney: {
          selectedPrisoners: [{ attendanceId: 1, prisonerNumber: 'ABC123', prisonerName: 'JOE BLOGGS' }],
        },
      },
      body: plainToInstance(NotAttendedForm, {
        notAttendedData: [
          {
            prisonerNumber: 'ABC123',
            prisonerName: 'JOE BLOGGS',
            notAttendedReason: AttendanceReasons.SICK,
            moreDetail: '',
            caseNote: null,
            otherAbsenceReason: null,
            sickPay: YesNo.YES,
          },
        ],
      }),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render with the expected view', async () => {
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
        selectedPrisoners: [{ attendanceId: 1, prisonerNumber: 'ABC123', prisonerName: 'JOE BLOGGS' }],
      })
    })
  })

  describe('POST', () => {
    const expectedAttendance = {
      id: 1,
      prisonCode: 'MDI',
      status: AttendanceStatus.COMPLETED,
      attendanceReason: AttendanceReasons.SICK,
      incentiveLevelWarningIssued: false,
      issuePayment: true,
      comment: '',
      caseNote: null,
      otherAbsenceReason: null,
    } as AttendanceUpdateRequest

    it('non attendance should be redirected to the non attendance page', async () => {
      await handler.POST(req, res)

      expect(activitiesService.updateAttendances).toBeCalledWith([expectedAttendance], res.locals.user)
      expect(res.redirectWithSuccess).toBeCalledWith(
        'attendance-list',
        'Attendance recorded',
        "We've saved attendance details for Joe Bloggs",
      )
    })
  })

  describe('Validation', () => {
    const attenance = {
      prisonerNumber: 'ABC123',
      prisonerName: 'Joe Bloggs',
      notAttendedReason: AttendanceReasons.SICK,
      sickPay: YesNo.YES,
    } as NotAttendedData
    const requestData = {
      notAttendedData: [
        attenance,
        {
          ...attenance,
          prisonerNumber: 'ABC234',
          prisonerName: 'John Smith',
        },
      ],
    } as NotAttendedForm

    it('should pass validation', async () => {
      const requestObject = plainToInstance(NotAttendedForm, requestData)
      const errors = await validate(requestObject)
      expect(errors.length).toEqual(0)
    })

    it('should fail validation if no attendence reason provided', async () => {
      const badRequest = {
        notAttendedData: [
          {
            ...attenance,
            notAttendedReason: undefined,
          },
        ],
      } as NotAttendedForm

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
            ...attenance,
            notAttendedReason: 'INVALID',
          },
        ],
      } as unknown as NotAttendedForm

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

    it('should fail validation if attendence reason is "SICK" and pay not selected', async () => {
      const badRequest = {
        notAttendedData: [
          {
            ...attenance,
            sickPay: undefined,
          },
        ],
      } as NotAttendedForm

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

    it('should fail validation if attendence reason is "REST" and pay not selected', async () => {
      const badRequest = {
        notAttendedData: [
          {
            ...attenance,
            notAttendedReason: AttendanceReasons.REST,
            restPay: undefined,
          },
        ],
      } as NotAttendedForm

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

    it('should fail validation if attendence reason is "OTHER" and pay not selected', async () => {
      const badRequest = {
        notAttendedData: [
          {
            ...attenance,
            notAttendedReason: AttendanceReasons.OTHER,
            otherAbsenceReason: 'absence reason',
            otherAbsencePay: undefined,
          },
        ],
      } as NotAttendedForm

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

    it('should fail validation if attendence reason is "OTHER" and other absence reason not entered', async () => {
      const badRequest = {
        notAttendedData: [
          {
            ...attenance,
            notAttendedReason: AttendanceReasons.OTHER,
            otherAbsenceReason: '',
            otherAbsencePay: YesNo.YES,
          },
        ],
      } as NotAttendedForm

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

    it('should fail validation if attendence reason is "OTHER" and other absence reason exceeds 100 characters', async () => {
      const badRequest = {
        notAttendedData: [
          {
            ...attenance,
            notAttendedReason: AttendanceReasons.OTHER,
            otherAbsenceReason: 'a'.repeat(101),
            otherAbsencePay: YesNo.YES,
          },
        ],
      } as NotAttendedForm

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

    it('should fail validation if attendence reason is "SICK" and more details exceed 100 characters', async () => {
      const badRequest = {
        notAttendedData: [
          {
            ...attenance,
            moreDetail: 'a'.repeat(101),
          },
        ],
      } as NotAttendedForm

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

    it('should fail validation if attendence reason is "REFUSED" and case note not entered', async () => {
      const badRequest = {
        notAttendedData: [
          {
            ...attenance,
            notAttendedReason: AttendanceReasons.REFUSED,
            incentiveLevelWarningIssued: YesNo.YES,
            caseNote: '',
          },
        ],
      } as NotAttendedForm

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

    it('should fail validation if attendence reason is "REFUSED" and case note exceeds 4000 characters', async () => {
      const badRequest = {
        notAttendedData: [
          {
            ...attenance,
            notAttendedReason: AttendanceReasons.REFUSED,
            incentiveLevelWarningIssued: YesNo.YES,
            caseNote: 'a'.repeat(4001),
          },
        ],
      } as NotAttendedForm

      const requestObject = plainToInstance(NotAttendedForm, badRequest)
      const errors = await validate(requestObject).then(errs =>
        errs[0]?.children[0]?.children.flatMap(associateErrorsWithProperty),
      )
      expect(errors.length).toEqual(1)
      expect(errors[0]).toEqual({
        property: 'caseNote',
        error: 'Case note must be 4000 characters or less',
      })
    })

    it('should fail validation if attendence reason is "REFUSED" and incentive level warning not selected', async () => {
      const badRequest = {
        notAttendedData: [
          {
            ...attenance,
            notAttendedReason: AttendanceReasons.REFUSED,
            incentiveLevelWarningIssued: undefined,
            caseNote: 'case note',
          },
        ],
      } as NotAttendedForm

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

    it('should not set case note when attendance reason not "REFUSED"', async () => {
      const request = {
        notAttendedData: [
          {
            ...attenance,
            notAttendedReason: AttendanceReasons.SICK,
            caseNote: 'case note',
          },
        ],
      } as NotAttendedForm

      const requestObject = plainToInstance(NotAttendedForm, request)
      expect(requestObject.notAttendedData[0].getCaseNote()).toBeNull()
    })

    it('should not issue payment if attendance reason is "REFUSED"', async () => {
      const request = {
        notAttendedData: [
          {
            ...attenance,
            notAttendedReason: AttendanceReasons.REFUSED,
            sickPay: YesNo.YES,
            restPay: YesNo.YES,
          },
        ],
      } as NotAttendedForm

      const requestObject = plainToInstance(NotAttendedForm, request)
      expect(requestObject.notAttendedData[0].getIssuePayment()).toEqual(false)
    })

    it('should always issue payment if attendance reason is "CLASH"', async () => {
      const request = {
        notAttendedData: [
          {
            ...attenance,
            notAttendedReason: AttendanceReasons.CLASH,
            sickPay: YesNo.NO,
            restPay: YesNo.NO,
          },
        ],
      } as NotAttendedForm

      const requestObject = plainToInstance(NotAttendedForm, request)
      expect(requestObject.notAttendedData[0].getIssuePayment()).toEqual(true)
    })

    it('should always issue payment if attendance reason is "NOT_REQUIRED"', async () => {
      const request = {
        notAttendedData: [
          {
            ...attenance,
            notAttendedReason: AttendanceReasons.NOT_REQUIRED,
            sickPay: YesNo.NO,
            restPay: YesNo.NO,
          },
        ],
      } as NotAttendedForm

      const requestObject = plainToInstance(NotAttendedForm, request)
      expect(requestObject.notAttendedData[0].getIssuePayment()).toEqual(true)
    })

    it('should not issue incentive level warning if attendance reason is not "REFUSED"', async () => {
      const request = {
        notAttendedData: [
          {
            ...attenance,
            notAttendedReason: AttendanceReasons.SICK,
            incentiveLevelWarningIssued: YesNo.YES,
          },
        ],
      } as NotAttendedForm

      const requestObject = plainToInstance(NotAttendedForm, request)
      expect(requestObject.notAttendedData[0].getIncentiveLevelWarning()).toEqual(false)
    })
  })
})
