import { Expose, plainToInstance, Transform } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../utils/utils'
import PayRateBetweenMinAndMax from './payRateBetweenMinAndMax'

describe('payRateBetweenMinAndMax', () => {
  class DummyForm {
    @Expose()
    @Transform(({ value }) => value * 100) // Transform to pence
    @PayRateBetweenMinAndMax({
      message: 'Enter a pay amount that is at least the minimum pay and no more than maximum pay',
    })
    payRate: number
  }

  it('should fail validation if rate entered is less than the minimum', async () => {
    const body = {
      payRate: '1',
    }

    const session = {
      createJourney: {
        minimumPayRate: 150,
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([
      {
        property: 'payRate',
        error: 'Enter a pay amount that is at least the minimum pay and no more than maximum pay',
      },
    ])
  })

  it('should fail validation if rate entered is more than the maximum', async () => {
    const body = {
      payRate: '3',
    }

    const session = {
      createJourney: {
        maximumPayRate: 250,
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([
      {
        property: 'payRate',
        error: 'Enter a pay amount that is at least the minimum pay and no more than maximum pay',
      },
    ])
  })

  it('should pass validation if the pay rate is between the min and max values', async () => {
    const body = {
      payRate: '1.50',
    }

    const session = {
      createJourney: {
        minimumPayRate: 100,
        maximumPayRate: 200,
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
