import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'

export default class BookAVideoLinkApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Book A Video Link API', config.apis.bookAVideoLinkApi as ApiConfig)
  }
}
