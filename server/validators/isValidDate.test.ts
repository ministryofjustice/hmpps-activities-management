import { Expose, Transform, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import IsValidDate from './isValidDate'
import { associateErrorsWithProperty } from '../utils/utils'
import { parseDatePickerDate } from '../utils/datePickerUtils'

describe('isValidDate', () => {
  class DummyForm {
    @Expose()
    @Transform(({ value }) => parseDatePickerDate(value))
    @IsValidDate({ message: 'Enter a valid date' })
    date: Date
  }

  it('should fail validation for a bad date', async () => {
    const body = {
      date: '32/2/2022',
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
  })

  it('should fail validation for an undefined date', async () => {
    const body = {}

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
  })

  it('should pass validation for a good date', async () => {
    const body = {
      date: '28/2/2022',
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
