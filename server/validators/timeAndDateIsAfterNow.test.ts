import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { getDate, getHours, getMinutes, getMonth, getYear } from 'date-fns'
import SimpleDate from '../commonValidationTypes/simpleDate'
import { associateErrorsWithProperty } from '../utils/utils'
import TimeAndDateIsAfterNow from './timeAndDateIsAfterNow'
import SimpleTime from '../commonValidationTypes/simpleTime'

describe('timeAndDateIsAfter', () => {
  class DummyForm {
    @Expose()
    date: SimpleDate

    @Expose()
    @TimeAndDateIsAfterNow('date', { message: 'Select a time that is in the future' })
    time: SimpleTime
  }

  it('should fail validation for a time in the past', async () => {
    const now = new Date()
    const body = {
      date: plainToInstance(SimpleDate, {
        day: getDate(now),
        month: getMonth(now) + 1,
        year: getYear(now),
      }),
      time: plainToInstance(SimpleTime, {
        hour: getHours(now),
        minute: getMinutes(now) - 5,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'time', error: 'Select a time that is in the future' }])
  })

  it('should fail validation for a time equal to now', async () => {
    const now = new Date()
    const body = {
      date: plainToInstance(SimpleDate, {
        day: getDate(now),
        month: getMonth(now) + 1,
        year: getYear(now),
      }),
      time: plainToInstance(SimpleTime, {
        hour: getHours(now),
        minute: getMinutes(now),
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'time', error: 'Select a time that is in the future' }])
  })

  it('should pass validation for a time after now', async () => {
    const now = new Date()
    const body = {
      date: plainToInstance(SimpleDate, {
        day: getDate(now),
        month: getMonth(now) + 1,
        year: getYear(now),
      }),
      time: plainToInstance(SimpleTime, {
        hour: getHours(now),
        minute: getMinutes(now) + 5,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation for a earlier than now but a day later', async () => {
    const now = new Date()
    const body = {
      date: plainToInstance(SimpleDate, {
        day: getDate(now) + 1,
        month: getMonth(now) + 1,
        year: getYear(now),
      }),
      time: plainToInstance(SimpleTime, {
        hour: getHours(now),
        minute: getMinutes(now) - 5,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
