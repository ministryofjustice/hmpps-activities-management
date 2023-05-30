import { getPagination, PaginationRequest } from './paginationUtils'

describe('Pagination tests', () => {
  it('should display pages 1-10 when more than 10 pages', () => {
    const req = { totalResults: 110, currentPage: 0, limit: 10 } as PaginationRequest
    const pagination = getPagination(req, new URL('http://localhost/'))
    expect(pagination.items).toEqual([
      { text: '1', href: 'http://localhost/?page=0', selected: true },
      { text: '2', href: 'http://localhost/?page=1', selected: false },
      { text: '3', href: 'http://localhost/?page=2', selected: false },
      { text: '4', href: 'http://localhost/?page=3', selected: false },
      { text: '5', href: 'http://localhost/?page=4', selected: false },
      { text: '6', href: 'http://localhost/?page=5', selected: false },
      { text: '7', href: 'http://localhost/?page=6', selected: false },
      { text: '8', href: 'http://localhost/?page=7', selected: false },
      { text: '9', href: 'http://localhost/?page=8', selected: false },
      { text: '10', href: 'http://localhost/?page=9', selected: false },
    ])
    expect(pagination.next).toEqual({ text: 'Next', href: 'http://localhost/?page=1' })
    expect(pagination.previous).toEqual({ text: 'Previous', href: 'http://localhost/?page=0' })
    expect(pagination.results).toEqual({ count: 110, from: 1, to: 10 })
  })

  it('should show 5 pages before and 5 pages after the current page', () => {
    const req = { totalResults: 220, currentPage: 6, limit: 10 } as PaginationRequest
    const pagination = getPagination(req, new URL('http://localhost/'))
    expect(pagination.items).toEqual([
      { text: '2', href: 'http://localhost/?page=1', selected: false },
      { text: '3', href: 'http://localhost/?page=2', selected: false },
      { text: '4', href: 'http://localhost/?page=3', selected: false },
      { text: '5', href: 'http://localhost/?page=4', selected: false },
      { text: '6', href: 'http://localhost/?page=5', selected: false },
      { text: '7', href: 'http://localhost/?page=6', selected: true },
      { text: '8', href: 'http://localhost/?page=7', selected: false },
      { text: '9', href: 'http://localhost/?page=8', selected: false },
      { text: '10', href: 'http://localhost/?page=9', selected: false },
      { text: '11', href: 'http://localhost/?page=10', selected: false },
    ])
    expect(pagination.next).toEqual({ text: 'Next', href: 'http://localhost/?page=7' })
    expect(pagination.previous).toEqual({ text: 'Previous', href: 'http://localhost/?page=5' })
    expect(pagination.results).toEqual({ count: 220, from: 61, to: 70 })
  })

  it('should show the last full page', () => {
    const req = { totalResults: 200, currentPage: 19, limit: 10 } as PaginationRequest
    const pagination = getPagination(req, new URL('http://localhost/'))
    expect(pagination.items).toEqual([
      { text: '11', href: 'http://localhost/?page=10', selected: false },
      { text: '12', href: 'http://localhost/?page=11', selected: false },
      { text: '13', href: 'http://localhost/?page=12', selected: false },
      { text: '14', href: 'http://localhost/?page=13', selected: false },
      { text: '15', href: 'http://localhost/?page=14', selected: false },
      { text: '16', href: 'http://localhost/?page=15', selected: false },
      { text: '17', href: 'http://localhost/?page=16', selected: false },
      { text: '18', href: 'http://localhost/?page=17', selected: false },
      { text: '19', href: 'http://localhost/?page=18', selected: false },
      { text: '20', href: 'http://localhost/?page=19', selected: true },
    ])
    expect(pagination.next).toEqual({ text: 'Next', href: 'http://localhost/?page=19' })
    expect(pagination.previous).toEqual({ text: 'Previous', href: 'http://localhost/?page=18' })
    expect(pagination.results).toEqual({ count: 200, from: 191, to: 200 })
  })

  it('should show a partial last page', () => {
    const req = { totalResults: 198, currentPage: 19, limit: 10 } as PaginationRequest
    const pagination = getPagination(req, new URL('http://localhost/'))
    expect(pagination.items).toEqual([
      { text: '11', href: 'http://localhost/?page=10', selected: false },
      { text: '12', href: 'http://localhost/?page=11', selected: false },
      { text: '13', href: 'http://localhost/?page=12', selected: false },
      { text: '14', href: 'http://localhost/?page=13', selected: false },
      { text: '15', href: 'http://localhost/?page=14', selected: false },
      { text: '16', href: 'http://localhost/?page=15', selected: false },
      { text: '17', href: 'http://localhost/?page=16', selected: false },
      { text: '18', href: 'http://localhost/?page=17', selected: false },
      { text: '19', href: 'http://localhost/?page=18', selected: false },
      { text: '20', href: 'http://localhost/?page=19', selected: true },
    ])
    expect(pagination.next).toEqual({ text: 'Next', href: 'http://localhost/?page=19' })
    expect(pagination.previous).toEqual({ text: 'Previous', href: 'http://localhost/?page=18' })
    expect(pagination.results).toEqual({ count: 198, from: 191, to: 198 })
  })

  it('should handle less than 10 pages', () => {
    const req = { totalResults: 70, currentPage: 0, limit: 10 } as PaginationRequest
    const pagination = getPagination(req, new URL('http://localhost/'))
    expect(pagination.items).toEqual([
      { text: '1', href: 'http://localhost/?page=0', selected: true },
      { text: '2', href: 'http://localhost/?page=1', selected: false },
      { text: '3', href: 'http://localhost/?page=2', selected: false },
      { text: '4', href: 'http://localhost/?page=3', selected: false },
      { text: '5', href: 'http://localhost/?page=4', selected: false },
      { text: '6', href: 'http://localhost/?page=5', selected: false },
      { text: '7', href: 'http://localhost/?page=6', selected: false },
    ])
    expect(pagination.next).toEqual({ text: 'Next', href: 'http://localhost/?page=1' })
    expect(pagination.previous).toEqual({ text: 'Previous', href: 'http://localhost/?page=0' })
    expect(pagination.results).toEqual({ count: 70, from: 1, to: 10 })
  })

  it('should show a single page with no pagination links', () => {
    const req = { totalResults: 6, currentPage: 0, limit: 10 } as PaginationRequest
    const pagination = getPagination(req, new URL('http://localhost/'))
    expect(pagination.items).toHaveLength(0)
    expect(pagination.next).toBeUndefined()
    expect(pagination.previous).toBeUndefined()
    expect(pagination.results).toEqual({ count: 6, from: 1, to: 6 })
  })
})
