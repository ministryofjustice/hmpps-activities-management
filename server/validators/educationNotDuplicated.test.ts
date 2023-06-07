import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../utils/utils'
import EducationNotDuplicated from './educationNotDuplicated'

describe('educationLevelNotDuplicated', () => {
  class DummyForm {
    @Expose()
    studyAreaCode: string

    @Expose()
    @EducationNotDuplicated({ message: 'Education already exists' })
    eduLevelCode: string
  }

  it('should fail validation if a duplicate education is selected', async () => {
    const body = {
      studyAreaCode: 'ENGLA',
      eduLevelCode: '1',
    }

    const session = {
      createJourney: {
        educationLevels: [
          {
            studyAreaCode: 'ENGLA',
            studyAreaDescription: 'English Language',
            educationLevelCode: '1',
            educationLevelDescription: 'xxx',
          },
        ],
      },
    }

    const requestObject = plainToInstance(DummyForm, { ...body, ...session })
    const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

    expect(errors).toEqual([{ property: 'eduLevelCode', error: 'Education already exists' }])
  })

  it('should pass validation if no education level exists in session', async () => {
    const body = {
      studyAreaCode: 'ENGLA',
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
