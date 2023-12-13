import AbstractHmppsRestClient from './abstractHmppsRestClient'
import config, { ApiConfig } from '../config'
import { ServiceUser } from '../@types/express'

type AvailableComponent = 'header' | 'footer'

interface Component {
  html: string
  css: string[]
  javascript: string[]
}

export default class FrontendComponentApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Frontend Component API', config.apis.frontendComponents as ApiConfig)
  }

  getComponents(components: AvailableComponent[], user: ServiceUser): Promise<Record<AvailableComponent, Component>> {
    return this.get({
      path: `/components`,
      query: `component=${components.join('&component=')}`,
      headers: { 'x-user-token': user.token },
      authToken: user.token,
    })
  }
}
