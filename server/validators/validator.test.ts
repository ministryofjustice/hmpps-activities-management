import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../utils/utils'
import Validator from './validator'

describe('validator', () => {
  class DummyForm {
    @Expose()
    @Validator((field, { extraData }) => field === extraData, {
      message: args => {
        const { field, extraData } = args.object as { field: number; extraData: number }
        return `The data entered (${field}), must be equal to ${extraData}`
      },
    })
    field: number
  }

  it('should pass the custom validation method', async () => {
    const body = { field: 1 }

    const requestObject = plainToInstance(DummyForm, { ...body, extraData: 1 })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should fail the custom validation method', async () => {
    const body = { field: 2 }

    const requestObject = plainToInstance(DummyForm, { ...body, extraData: 1 })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([
      {
        error: 'The data entered (2), must be equal to 1',
        property: 'field',
      },
    ])
  })
})
