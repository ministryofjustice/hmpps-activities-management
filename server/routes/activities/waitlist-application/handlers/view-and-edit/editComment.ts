import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { Length, ValidateIf } from 'class-validator'
import { isBlank } from '../../../../../utils/utils'
import ActivitiesService from '../../../../../services/activitiesService'

export class Comment {
  @Expose()
  @Transform(({ value }) => (isBlank(value) ? undefined : value.trim().replaceAll('\r', '')))
  @ValidateIf(o => o.comment?.length > 0)
  @Length(0, 500, { message: 'Comment must be 500 characters or less' })
  comment: string
}

export default class EditCommentRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render(`pages/activities/waitlist-application/edit-comment`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { applicationId } = req.params
    const { user } = res.locals
    const { comment } = req.body

    await this.activitiesService.patchWaitlistApplication(+applicationId, { comments: comment }, user)

    return res.redirectWithSuccess(
      `view`,
      `You have updated the comment for ${req.session.waitListApplicationJourney.prisoner.name}'s application`,
    )
  }
}
