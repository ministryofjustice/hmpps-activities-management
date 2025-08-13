import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'

enum QualificationOption {
  YES = 'yes',
  NO = 'no',
}

export class Qualification {
  @Expose()
  @IsIn(Object.values(QualificationOption), {
    message: 'Select yes if education levels or qualifications are required',
  })
  qualificationOption: QualificationOption
}

export default class QualificationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/activities/create-an-activity/qualification`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.journeyData.createJourney.qualificationOption = req.body.qualificationOption
    if (req.body.qualificationOption === QualificationOption.YES) res.redirectOrReturn(`education-level`)
    else res.redirectOrReturn(`start-date`)
  }
}
