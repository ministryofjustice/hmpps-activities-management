import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../utils/utils'
import NotAttendedData, {
  AbsenceReasonRequired,
  CaseNoteRequired,
  IncentiveLevelWarningRequired,
  PayRequired,
  ReasonEnteredForAllPrisoners,
} from './validateNotAttendedData'

describe('validateNotAttendedData', () => {
  class DummyForm {
    @Expose()
    @ReasonEnteredForAllPrisoners({ message: 'Enter an absence reason for all prisoners' })
    @AbsenceReasonRequired({ message: 'Please enter a reason for the absence' })
    @PayRequired({ message: 'Please specify whether the prisoner should be paid' })
    @CaseNoteRequired({ message: 'Please enter a case note' })
    @IncentiveLevelWarningRequired({
      message: 'Please specify whether this should be recorded as an incentive level warning',
    })
    notAttendedData: NotAttendedData
  }

  it('should fail validation if a reason is not entered for every prisoner', async () => {
    const body = {
      notAttendedData: {
        ABC123: {
          moreDetail: '',
          caseNote: '',
          absenceReason: '',
        },
      },
    }

    const session = {
      notAttendedJourney: {
        selectedPrisoners: [{ attendanceId: 1, prisonerNumber: 'ABC123' }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'notAttendedData', error: 'Enter an absence reason for all prisoners' }])
  })

  it('should fail validation if pay question is not answered for a SICK prisoner', async () => {
    const body = {
      notAttendedData: {
        ABC123: {
          notAttendedReason: 'SICK',
          moreDetail: 'more detail for sickness',
          caseNote: '',
          absenceReason: '',
        },
      },
    }

    const session = {
      notAttendedJourney: {
        selectedPrisoners: [{ attendanceId: 1, prisonerNumber: 'ABC123' }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([
      { property: 'notAttendedData', error: 'Please specify whether the prisoner should be paid' },
    ])
  })

  it('should fail validation if pay question is not answered for a REST prisoner', async () => {
    const body = {
      notAttendedData: {
        ABC123: {
          notAttendedReason: 'REST',
          moreDetail: '',
          caseNote: '',
          absenceReason: '',
        },
      },
    }

    const session = {
      notAttendedJourney: {
        selectedPrisoners: [{ attendanceId: 1, prisonerNumber: 'ABC123' }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([
      { property: 'notAttendedData', error: 'Please specify whether the prisoner should be paid' },
    ])
  })

  it('should fail validation if pay question is not answered for an OTHER prisoner', async () => {
    const body = {
      notAttendedData: {
        ABC123: {
          notAttendedReason: 'OTHER',
          moreDetail: '',
          caseNote: '',
          absenceReason: 'absence reason',
        },
      },
    }

    const session = {
      notAttendedJourney: {
        selectedPrisoners: [{ attendanceId: 1, prisonerNumber: 'ABC123' }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([
      { property: 'notAttendedData', error: 'Please specify whether the prisoner should be paid' },
    ])
  })

  it('should fail validation if no absence reason is provided for an OTHER prisoner', async () => {
    const body = {
      notAttendedData: {
        ABC123: {
          notAttendedReason: 'OTHER',
          pay: true,
          moreDetail: '',
          caseNote: '',
          absenceReason: '',
        },
      },
    }

    const session = {
      notAttendedJourney: {
        selectedPrisoners: [{ attendanceId: 1, prisonerNumber: 'ABC123' }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'notAttendedData', error: 'Please enter a reason for the absence' }])
  })

  it('should fail validation if no case note is provided for a REFUSED prisoner', async () => {
    const body = {
      notAttendedData: {
        ABC123: {
          notAttendedReason: 'REFUSED',
          moreDetail: '',
          caseNote: '',
          incentiveLevelWarningIssued: true,
          absenceReason: '',
        },
      },
    }

    const session = {
      notAttendedJourney: {
        selectedPrisoners: [{ attendanceId: 1, prisonerNumber: 'ABC123' }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'notAttendedData', error: 'Please enter a case note' }])
  })

  it('should fail validation if incentive level warning question is not answered for a REFUSED prisoner', async () => {
    const body = {
      notAttendedData: {
        ABC123: {
          notAttendedReason: 'REFUSED',
          moreDetail: '',
          caseNote: 'case note',
          absenceReason: '',
        },
      },
    }

    const session = {
      notAttendedJourney: {
        selectedPrisoners: [{ attendanceId: 1, prisonerNumber: 'ABC123' }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([
      {
        property: 'notAttendedData',
        error: 'Please specify whether this should be recorded as an incentive level warning',
      },
    ])
  })

  it('should pass validation if an absence reason and supporting data is entered for all prisoners', async () => {
    const body = {
      notAttendedData: {
        ABC123: {
          notAttendedReason: 'SICK',
          pay: true,
          moreDetail: 'more detail for sickness',
          caseNote: '',
          absenceReason: '',
        },
        ABC456: {
          notAttendedReason: 'OTHER',
          pay: true,
          moreDetail: '',
          caseNote: '',
          absenceReason: 'other reason for absence',
        },
      },
    }

    const session = {
      notAttendedJourney: {
        selectedPrisoners: [
          { attendanceId: 1, prisonerNumber: 'ABC123' },
          { attendanceId: 2, prisonerNumber: 'ABC456' },
        ],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
