import { stubFor } from './wiremock'

const stubEndpoint = (method: string, urlPattern: string, responseFixture: JSON, responseStatus = 200) =>
  stubFor({
    request: {
      method,
      urlPattern,
    },
    response: {
      status: responseStatus,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: responseFixture,
    },
  })

export default stubEndpoint
