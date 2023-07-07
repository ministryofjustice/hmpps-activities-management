import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SimpleDate from '../commonValidationTypes/simpleDate'
import { associateErrorsWithProperty } from '../utils/utils'
import DateIsAfterOtherProperty from './dateIsAfterOtherProperty'

describe('dateIsAfterOtherProperty', () => {
  class DummyForm {
    @Expose()
    @DateIsAfterOtherProperty('otherDate', { message: 'Enter date after the other date' })
    date: SimpleDate

    otherDate: string
  }

  it('should fail validation for a date before the other date', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 19,
        month: 12,
        year: 2022,
      }),
      otherDate: '2022-12-20',
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'date', error: 'Enter date after the other date' }])
  })

  it('should fail validation for a date equal to the other date', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 21,
        month: 12,
        year: 2022,
      }),
      otherDate: '2022-12-21',
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'date', error: 'Enter date after the other date' }])
  })

  it('should pass validation for a date after to the other date', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 22,
        month: 12,
        year: 2022,
      }),
      otherDate: '2022-12-21',
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation if the other date doesnt have a value', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 22,
        month: 12,
        year: 2022,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation if the other date is empty', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 22,
        month: 12,
        year: 2022,
      }),
      otherDate: '',
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
