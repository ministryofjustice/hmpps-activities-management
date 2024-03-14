import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn, IsNotEmpty, MaxLength } from 'class-validator'

export class CaseNote {
  @Expose()
  @IsIn(['GEN', 'NEG'], { message: 'Select the type of case note' })
  type: string

  @Expose()
  @IsNotEmpty({ message: 'Enter a case note' })
  @MaxLength(3800, { message: 'Case note must be $constraint1 characters or less' })
  text: string
}

export default class CaseNoteRoutes {
  GET = async (req: Request, res: Response): Promise<void> => res.render('pages/activities/suspensions/case-note')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { type, text } = req.body

    req.session.suspendJourney.caseNote = { type, text }
    return res.redirect('check-answers')
  }
}
