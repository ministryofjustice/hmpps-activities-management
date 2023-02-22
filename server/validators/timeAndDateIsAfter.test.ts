import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SimpleDate from '../commonValidationTypes/simpleDate'
import { associateErrorsWithProperty } from '../utils/utils'
import TimeAndDateIsAfter from './timeAndDateIsAfter'
import SimpleTime from '../commonValidationTypes/simpleTime'

describe('timeAndDateIsAfter', () => {
  class DummyForm {
    @Expose()
    date: SimpleDate

    @Expose()
    @TimeAndDateIsAfter(new Date('2023-02-22T12:30:00.000Z'), 'date', { message: 'Time must be in the future' })
    time: SimpleTime
  }

  it('should fail validation for a time before the supplied date', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 22,
        month: 2,
        year: 2023,
      }),
      time: plainToInstance(SimpleTime, {
        hour: 12,
        minute: 25,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'time', error: 'Time must be in the future' }])
  })

  it('should fail validation for a time equal to the supplied date', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 22,
        month: 2,
        year: 2023,
      }),
      time: plainToInstance(SimpleTime, {
        hour: 12,
        minute: 30,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'time', error: 'Time must be in the future' }])
  })

  it('should pass validation for a time after the supplied date', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 22,
        month: 2,
        year: 2023,
      }),
      time: plainToInstance(SimpleTime, {
        hour: 12,
        minute: 35,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation for a earlier than the supplied date but a day later', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 23,
        month: 2,
        year: 2023,
      }),
      time: plainToInstance(SimpleTime, {
        hour: 12,
        minute: 25,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
