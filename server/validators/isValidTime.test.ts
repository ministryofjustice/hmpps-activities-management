import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import IsValidTime from './isValidTime'
import SimpleTime from '../commonValidationTypes/simpleTime'
import { associateErrorsWithProperty } from '../utils/utils'

describe('isValidTime', () => {
  class DummyForm {
    @Expose()
    @IsValidTime({ message: 'Enter a valid time' })
    time: SimpleTime
  }

  it('should fail validation for a bad time', async () => {
    const body = {
      time: plainToInstance(SimpleTime, {
        hour: 'twelve',
        minute: 'thirty',
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'time', error: 'Enter a valid time' }])
  })

  it('should fail validation for an undefined time', async () => {
    const body = {}

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'time', error: 'Enter a valid time' }])
  })

  it('should pass validation for a good time', async () => {
    const body = {
      time: plainToInstance(SimpleTime, {
        hour: 12,
        minute: 30,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
