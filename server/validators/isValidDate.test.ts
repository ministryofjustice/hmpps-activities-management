import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import IsValidDate from './isValidDate'
import SimpleDate from '../commonValidationTypes/simpleDate'
import { associateErrorsWithProperty } from '../utils/utils'

describe('isValidDate', () => {
  class DummyForm {
    @Expose()
    @IsValidDate({ message: 'Enter a valid date' })
    date: SimpleDate
  }

  it('should fail validation for a bad date', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 32,
        month: 2,
        year: 2022,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
  })

  it('should pass validation for a good date', async () => {
    const body = {
      date: plainToInstance(SimpleDate, {
        day: 28,
        month: 2,
        year: 2022,
      }),
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
