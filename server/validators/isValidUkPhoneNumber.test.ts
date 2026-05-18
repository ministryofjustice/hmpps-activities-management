import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import IsValidUkPhoneNumber from './isValidUkPhoneNumber'
import { associateErrorsWithProperty } from '../utils/utils'

describe('isValidPhoneNumber', () => {
  class DummyForm {
    @Expose()
    @IsValidUkPhoneNumber({ message: 'Enter a valid phone number' })
    phoneNumber: string
  }

  it('should fail validation for a bad phone number', async () => {
    const body = {
      phoneNumber: 'O1733 333867',
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'phoneNumber', error: 'Enter a valid phone number' }])
  })

  it('should pass validation for a good phone number', async () => {
    const body = {
      phoneNumber: '01733 333867',
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
