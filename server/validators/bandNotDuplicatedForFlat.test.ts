import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../utils/utils'
import IsNotDuplicatedForFlat from './bandNotDuplicatedForFlat'

describe('bandNotDuplicatedForFlat', () => {
  class DummyForm {
    @Expose()
    @IsNotDuplicatedForFlat({ message: 'A rate for the selected band already exists' })
    bandId: number
  }

  it('should fail validation if a duplicate band is selected', async () => {
    const body = {
      bandId: 1,
    }

    const session = {
      createJourney: {
        flat: [{ bandId: 1 }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'bandId', error: 'A rate for the selected band already exists' }])
  })

  it('should pass validation if a new bandId is selected', async () => {
    const body = {
      bandId: 2,
    }

    const session = {
      createJourney: {
        pay: [{ bandId: 1 }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })

  it('should pass validation if no flat pay exists in session', async () => {
    const body = {
      bandId: 1,
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
      currentPayBand: 1,
    }

    const session = {
      createJourney: {
        pay: [{ bandId: 1 }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
