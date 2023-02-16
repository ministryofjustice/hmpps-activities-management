import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SimpleTime from '../commonValidationTypes/simpleTime'
import { associateErrorsWithProperty } from '../utils/utils'
import TimeIsAfter from './timeIsAfter'

describe('timeIsAfter', () => {
  class DummyForm {
    time: SimpleTime

    @Expose()
    @TimeIsAfter('time', { message: 'Select an other time after the time' })
    otherTime: SimpleTime
  }

  it('should fail validation for an other time before the time', async () => {
    const body = {
      time: plainToInstance(SimpleTime, {
        hour: 12,
        minute: 30,
      }),
      otherTime: plainToInstance(SimpleTime, {
        hour: 12,
        minute: 29,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'otherTime', error: 'Select an other time after the time' }])
  })

  it('should fail validation for an other time equal to the time', async () => {
    const body = {
      time: plainToInstance(SimpleTime, {
        hour: 12,
        minute: 30,
      }),
      otherTime: plainToInstance(SimpleTime, {
        hour: 12,
        minute: 30,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'otherTime', error: 'Select an other time after the time' }])
  })

  it('should pass validation for an other time after the time', async () => {
    const body = {
      time: plainToInstance(SimpleTime, {
        hour: 12,
        minute: 30,
      }),
      otherTime: plainToInstance(SimpleTime, {
        hour: 12,
        minute: 31,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation if the time is undefined', async () => {
    const body = {
      otherTime: plainToInstance(SimpleTime, {
        hour: 12,
        minute: 31,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
