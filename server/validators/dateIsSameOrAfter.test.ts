import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SimpleDate from '../commonValidationTypes/simpleDate'
import { associateErrorsWithProperty, toDate } from '../utils/utils'
import DateIsSameOrAfter from './dateIsSameOrAfter'

describe('dateIsSameOrAfter', () => {
  class DummyForm {
    @Expose()
    @DateIsSameOrAfter(() => toDate('2022-12-22'), { message: "Enter date on or after today's date" })
    date: SimpleDate
  }

  class DummyFormWithOtherDate {
    @Expose()
    @DateIsSameOrAfter(o => o.otherDate, { message: 'Enter date on or after the other date' })
    date: SimpleDate
  }

  it('should fail validation for a date before the supplied date', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 21,
        month: 12,
        year: 2022,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'date', error: "Enter date on or after today's date" }])
  })

  it('should fail validation for a date before the supplied other date', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 21,
        month: 12,
        year: 2022,
      }),
      otherDate: new Date('2022-12-22'),
    }

    const requestObject = plainToInstance(DummyFormWithOtherDate, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'date', error: 'Enter date on or after the other date' }])
  })

  it('should pass validation for a date equal to the supplied date', async () => {
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

  it('should pass validation for a date after the supplied date', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 23,
        month: 12,
        year: 2022,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
