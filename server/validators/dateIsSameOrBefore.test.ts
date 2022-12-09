import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SimpleDate from '../commonValidationTypes/simpleDate'
import { associateErrorsWithProperty, toDate } from '../utils/utils'
import DateIsSameOrBefore from './dateIsSameOrBefore'

describe('dateIsSameOrBefore', () => {
  class DummyForm {
    @Expose()
    @DateIsSameOrBefore(toDate('2022-12-22'), { message: "Enter date on or before today's date" })
    date: SimpleDate
  }

  it('should fail validation for a date after the supplied date', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 23,
        month: 12,
        year: 2022,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'date', error: "Enter date on or before today's date" }])
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

  it('should pass validation for a date before the supplied date', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 21,
        month: 12,
        year: 2022,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
