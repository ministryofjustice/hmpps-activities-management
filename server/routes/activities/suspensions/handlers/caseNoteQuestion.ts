import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'

export class CaseNoteQuestion {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Select either yes or no' })
  choice: string
}

export default class CaseNoteQuestionRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/suspensions/case-note-question')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { choice } = req.body
    if (choice === 'yes') {
      return res.redirect('case-note')
    }

    req.session.suspendJourney.caseNote = null
    return res.redirect('check-answers')
  }
}
