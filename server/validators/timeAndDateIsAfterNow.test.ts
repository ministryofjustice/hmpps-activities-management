import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, addMinutes, getHours, getMinutes, subMinutes } from 'date-fns'
import { associateErrorsWithProperty } from '../utils/utils'
import TimeAndDateIsAfterNow from './timeAndDateIsAfterNow'
import SimpleTime, { simpleTimeFromDate } from '../commonValidationTypes/simpleTime'

describe('timeAndDateIsAfter', () => {
  class DummyForm {
    @Expose()
    date: string

    @Expose()
    @TimeAndDateIsAfterNow('date', { message: 'Select a time that is in the future' })
    time: SimpleTime
  }

  it('should fail validation for a time in the past', async () => {
    // Test will fail if run at midnight
    const now = new Date()
    if (getHours(now) === 0 && getMinutes(now) === 0) {
      return
    }

    const todayOneMinuteInThePast = subMinutes(now, 1)
    const body = {
      date: todayOneMinuteInThePast,
      time: simpleTimeFromDate(todayOneMinuteInThePast),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'time', error: 'Select a time that is in the future' }])
  })

  it('should fail validation for a time equal to now', async () => {
    const now = new Date()
    const body = {
      date: now,
      time: simpleTimeFromDate(now),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'time', error: 'Select a time that is in the future' }])
  })

  it('should pass validation for a time after now', async () => {
    const todayOneMinuteInTheFuture = addMinutes(new Date(), 1)
    const body = {
      date: todayOneMinuteInTheFuture,
      time: simpleTimeFromDate(todayOneMinuteInTheFuture),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation for a earlier than now but a day later', async () => {
    const tomorrowOneMinuteInThePast = subMinutes(addDays(new Date(), 1), 1)
    const body = {
      date: tomorrowOneMinuteInThePast,
      time: simpleTimeFromDate(tomorrowOneMinuteInThePast),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
