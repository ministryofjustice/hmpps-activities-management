import Page from '../../page'

export default class CommentPage extends Page {
  constructor() {
    super('appointments-create-comment-page')
  }

  enterComment = (comment: string) => this.getInputByName('comment').clear().type(comment)
}
