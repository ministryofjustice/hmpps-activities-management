import Page from '../page'

export default class BeforeYouAllocate extends Page {
  constructor() {
    super('before-you-allocate-page')
  }

  selectConfirmationRadio = (option: string) => this.getInputByName('confirm').check(option).click()
}
