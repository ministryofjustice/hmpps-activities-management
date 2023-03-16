import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../utils/utils'
import MaxWhenDependentPropertyValueIs from './maxWhenDependentPropertyValueIs'

describe('maxWhenDependentPropertyValueIs', () => {
  enum AffectsMax {
    MaxOne,
    MaxThree,
  }

  class DummyForm {
    affectsMax: AffectsMax

    @MaxWhenDependentPropertyValueIs(1, 'affectsMax', AffectsMax.MaxOne, {
      message: 'The error message when MaxOne is exceeded',
    })
    @MaxWhenDependentPropertyValueIs(3, 'affectsMax', AffectsMax.MaxThree, {
      message: 'A different error message when MaxThree is exceeded',
    })
    hasMax: number
  }

  class InvalidDummyForm {
    affectsMax: AffectsMax

    @MaxWhenDependentPropertyValueIs(1, 'notAffectsMax', AffectsMax.MaxOne, {
      message: 'The error message when MaxOne is exceeded',
    })
    hasMax: number
  }

  it.each([
    { affectsMax: AffectsMax.MaxOne, hasMax: 2, expectedMessage: 'The error message when MaxOne is exceeded' },
    {
      affectsMax: AffectsMax.MaxThree,
      hasMax: 4,
      expectedMessage: 'A different error message when MaxThree is exceeded',
    },
  ])('should fail validation for an other time before the time', async ({ affectsMax, hasMax, expectedMessage }) => {
    const body = {
      affectsMax,
      hasMax,
    }

    const requestObject = plainToInstance(DummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'hasMax', error: expectedMessage }])
  })

  it('should pass validation when dependent property not found', async () => {
    const body = {
      affectsMax: AffectsMax.MaxOne,
      hasMax: 2,
    }

    const requestObject = plainToInstance(InvalidDummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation when dependent property value is invalid', async () => {
    const body = {
      affectsMax: 'INVALID',
      hasMax: 2,
    }

    const requestObject = plainToInstance(InvalidDummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation when dependent property value is valid and max is valid', async () => {
    const body = {
      affectsMax: AffectsMax.MaxThree,
      hasMax: 3,
    }

    const requestObject = plainToInstance(InvalidDummyForm, body)
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
