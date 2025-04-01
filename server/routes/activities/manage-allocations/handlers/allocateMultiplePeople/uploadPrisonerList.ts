import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../../services/prisonService'
import PrisonerListCsvParser from '../../../../../utils/prisonerListCsvParser'
import IsNotEmptyFile from '../../../../../validators/isNotEmptyFile'
import IsValidCsvFile from '../../../../../validators/isValidCsvFile'
import { Inmate } from '../../journey'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import { PrisonerAllocations } from '../../../../../@types/activitiesAPI/types'
import { addNonAssociations, addOtherAllocations } from '../../../../../utils/helpers/allocationUtil'
import ActivityService from '../../../../../services/activitiesService'
import NonAssociationsService from '../../../../../services/nonAssociationsService'

export class UploadPrisonerList {
  @Expose()
  @IsNotEmpty({ message: 'You must select a file' })
  @IsNotEmptyFile({ message: 'The selected file is empty' })
  @IsValidCsvFile({ message: 'You must upload a CSV file' })
  file: Express.Multer.File
}

export default class UploadPrisonerListRoutes {
  constructor(
    private readonly prisonerListCsvParser: PrisonerListCsvParser,
    private readonly prisonService: PrisonService,
    private readonly activitiesService: ActivityService,
    private readonly nonAssociationsService: NonAssociationsService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/uploadPrisonerList')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const prisonerListCsvFile = req.file
    const { user } = res.locals
    const { activity } = req.session.allocateJourney

    const prisonerNumbers: string[] = await this.prisonerListCsvParser.getPrisonNumbers(prisonerListCsvFile)

    if (prisonerNumbers.length === 0) {
      return res.validationFailed('file', 'The selected file does not contain any prison numbers')
    }

    const prisoners: Prisoner[] = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)

    const inmates: Inmate[] = prisoners
      .filter(prisoner => prisoner.prisonId === user.activeCaseLoadId)
      .map(
        prisoner =>
          ({
            prisonerName: `${prisoner.firstName} ${prisoner.lastName}`,
            firstName: prisoner.firstName,
            middleNames: prisoner.middleNames,
            lastName: prisoner.lastName,
            prisonerNumber: prisoner.prisonerNumber,
            prisonCode: prisoner.prisonId,
            status: prisoner.status,
            cellLocation: prisoner.cellLocation,
            incentiveLevel: prisoner.currentIncentive?.level.description,
            payBand: undefined,
          }) as Inmate,
      )

    // get other allocations for the unallocated prisoners
    const unallocatedPrisonerNumbers: string[] = inmates.map(inmate => inmate.prisonerNumber)
    const prisonerAllocationsList: PrisonerAllocations[] =
      await this.activitiesService.getActivePrisonPrisonerAllocations(unallocatedPrisonerNumbers, user)
    addOtherAllocations(inmates, prisonerAllocationsList, activity.scheduleId)

    // get non associations
    const nonAssociations: string[] = await this.nonAssociationsService.getListPrisonersWithNonAssociations(
      unallocatedPrisonerNumbers,
      user,
    )

    addNonAssociations(inmates, nonAssociations)

    const prisonerNumbersFound: string[] = prisoners.map(prisoner => prisoner.prisonerNumber)
    const prisonerNumbersNotFound: string[] = prisonerNumbers.filter(
      prisonerNumber => !prisonerNumbersFound.includes(prisonerNumber),
    )

    if (prisonerNumbersNotFound.length > 0) {
      const message =
        prisonerNumbersNotFound.length === 1
          ? `The following prison number does not match anyone in this prison: ${prisonerNumbersNotFound[0]}`
          : `The following prison numbers do not match anyone in this prison: ${prisonerNumbersNotFound.join(', ')}`
      return res.validationFailed('file', message)
    }

    req.session.allocateJourney.inmates = inmates
    req.session.allocateJourney.allocatedInmates = undefined
    req.session.allocateJourney.withoutMatchingIncentiveLevelInmates = undefined

    return res.redirect('review-upload-prisoner-list')
  }
}
