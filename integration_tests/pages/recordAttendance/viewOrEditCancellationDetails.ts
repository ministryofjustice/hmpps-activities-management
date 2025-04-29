import Page from '../page'

export default class ViewOrEditCancellationDetailsPage extends Page {
  constructor() {
    super('view-or-edit-cancellation-page')
  }

  assertCancellationDetail = (header: string, value: string) =>
    this.assertSummaryListValue('cancellation-details', header, value)
}
