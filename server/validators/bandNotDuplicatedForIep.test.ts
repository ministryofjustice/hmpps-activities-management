import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../utils/utils'
import IsNotDuplicatedForIep from './bandNotDuplicatedForIep'

describe('bandNotDuplicatedForIep', () => {
  class DummyForm {
    @Expose()
    @IsNotDuplicatedForIep({ message: 'A rate for the selected band and incentive level already exists' })
    bandId: number

    @Expose()
    incentiveLevels: string[]
  }

  it('should fail validation if a duplicate band and iep level are selected', async () => {
    const body = {
      bandId: 1,
      incentiveLevels: ['Basic'],
    }

    const session = {
      createJourney: {
        pay: [{ bandId: 1, incentiveLevel: 'Basic' }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([
      { property: 'bandId', error: 'A rate for the selected band and incentive level already exists' },
    ])
  })

  it('should pass validation if a new bandId is selected for the same iep level', async () => {
    const body = {
      bandId: 2,
      incentiveLevels: ['Basic'],
    }

    const session = {
      createJourney: {
        pay: [{ bandId: 1, incentiveLevel: 'Basic' }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation if a new iep level is selected for the same bandId', async () => {
    const body = {
      bandId: 1,
      incentiveLevel: 'Standard',
    }

    const session = {
      createJourney: {
        pay: [{ bandId: 1, incentiveLevel: 'Basic' }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation if no pay exists in session', async () => {
    const body = {
      bandId: 1,
      incentiveLevels: ['Standard'],
    }

    const session = {
      createJourney: {},
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should not consider the current pay rate as a duplicate', async () => {
    const body = {
      bandId: 1,
      incentiveLevels: ['Basic'],
      currentPayBand: 1,
      currentIncentiveLevel: 'Basic',
    }

    const session = {
      createJourney: {
        pay: [{ bandId: 1, incentiveLevel: 'Basic' }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
