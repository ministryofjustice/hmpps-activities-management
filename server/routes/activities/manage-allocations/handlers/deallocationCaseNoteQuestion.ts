import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'

export class DeallocationCaseNoteQuestion {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Select either yes or no' })
  choice: string
}

export default class DeallocationCaseNoteQuestionRoutes {
  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/activities/manage-allocations/deallocation-case-note-question')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { choice } = req.body
    return choice === 'yes' ? res.redirect('case-note') : res.redirect('check-answers')
  }
}
