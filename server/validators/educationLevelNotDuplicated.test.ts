import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../utils/utils'
import EducationLevelNotDuplicated from './educationLevelNotDuplicated'

describe('educationLevelNotDuplicated', () => {
  class DummyForm {
    @Expose()
    @EducationLevelNotDuplicated({ message: 'The education level already exists on this activity' })
    referenceCode: string

    @Expose()
    educationLevels: []
  }

  it('should fail validation if a duplicate education level is selected', async () => {
    const body = {
      referenceCode: '1',
    }

    const session = {
      createJourney: {
        educationLevels: [{ educationLevelCode: '1', educationLevelDescription: 'xxx' }],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([
      { property: 'referenceCode', error: 'The education level already exists on this activity' },
    ])
  })

  it('should pass validation if no education level exists in session', async () => {
    const body = {
      referenceCode: '1',
    }

    const session = {
      createJourney: {},
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toHaveLength(0)
  })
})
