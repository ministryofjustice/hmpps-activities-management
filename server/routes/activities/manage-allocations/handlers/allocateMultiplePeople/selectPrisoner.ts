import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import IsNotAnExistingAttendee from '../../../../../validators/IsNotAnExistingAttendee'
import PrisonService from '../../../../../services/prisonService'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'

export class SelectPrisoner {
  @Expose()
  @IsNotEmpty({ message: 'You must select one option' })
  @IsNotAnExistingAttendee({
    message: 'The prisoner you have selected is already allocated to {{ session.activity.name }}',
  })
  selectedPrisoner: string
}

export class PrisonerSearch {
  @Expose()
  @IsNotEmpty({ message: 'You must enter a name or prison number in the format AB1234C' })
  query: string
}

export default class SelectPrisonerRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    let { query } = req.query
    if (res.locals.formResponses?.query !== undefined) {
      query = res.locals.formResponses.query
    }

    if (query && typeof query === 'string') {
      const result = await this.prisonService.searchPrisonInmates(query, user)
      let prisoners: Prisoner[] = []
      if (result && !result.empty) prisoners = result.content
      return res.render('pages/activities/manage-allocations/allocateMultiplePeople/selectPrisoner', {
        prisoners,
        query,
      })
    }

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/selectPrisoner')
  }

  SEARCH = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.body
    return res.redirect(`select-prisoner?query=${query}`)
  }
}
