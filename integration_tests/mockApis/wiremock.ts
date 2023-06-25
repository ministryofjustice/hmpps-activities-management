import superagent, { SuperAgentRequest, Response } from 'superagent'

const url = 'http://localhost:9091/__admin'

const stubFor = (mapping: Record<string, unknown>): SuperAgentRequest =>
  superagent.post(`${url}/mappings`).send(mapping)

const getMatchingRequests = body => superagent.post(`${url}/requests/find`).send(body)

const resetStubs = (): Promise<Array<Response>> =>
  Promise.all([superagent.delete(`${url}/mappings`), superagent.delete(`${url}/requests`)])

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

export { stubFor, getMatchingRequests, resetStubs, stubEndpoint }
