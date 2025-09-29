import { Expose, plainToInstance, Transform } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../utils/utils'
import CurrentPayRateSameAsPreviousRate from './currentPayRateSameAsPreviousRate'

describe('currentPayRateSameAsPreviousRate', () => {
  class DummyForm {
    @Expose()
    @Transform(({ value }) => value * 100) // Transform to pence
    @CurrentPayRateSameAsPreviousRate({
      message: 'The pay amount must be different to the previous amount',
    })
    payRate: number
  }

  it('should fail validation if rate entered is equal to the previous rate', async () => {
    const body = {
      payRate: '2.5',
    }

    const session = {
      createJourney: {
        previousPayRate: 250,
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([
      {
        property: 'payRate',
        error: 'The pay amount must be different to the previous amount',
      },
    ])
  })

  it('should pass validation if the pay rate is not equal to the previous rate', async () => {
    const body = {
      payRate: '1.50',
    }

    const session = {
      createJourney: {
        previousPayRate: 100,
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation if the pay rate is undefined', async () => {
    const body = {
      payRate: undefined,
    }

    const session = {
      createJourney: {
        previousPayRate: 100,
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation if the pay rate is null', async () => {
    const body = {
      payRate: null,
    }

    const session = {
      createJourney: {
        previousPayRate: 100,
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation if the pay rate is unavailable', async () => {
    const body = {}

    const session = {
      createJourney: {
        previousPayRate: 200,
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
