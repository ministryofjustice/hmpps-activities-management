/*
The pagination service only shows 10 page links regardless of where the current page is pointed.

Rules:
  1) Show only 10 page links
  2) Show pages 5 before and after the current page
  3) Where there are less than 5 pages before the current page show the remaining
  4) Where there are more than 5 pages after the current page show the remaining

  1 2 3 4 5 6 7 8 9 10
^
1 2 3 4 5 6 7 8 9 10
          ^
2 3 4 5 6 7 8 9 10 11
          ^
4 5 6 7 8 9 10 11 12 13
          ^
 2 3 4 5 6 7 8 9 10 11
          ^
4 5 6 7 8 9 10 11 13 14
          ^
4 5 6 7 8 9 10 11 13 14
            ^
4 5 6 7 8 9 10 11 13 14           ^
 */

const maxNumberOfPageLinks = 10
const pageBreakPoint = maxNumberOfPageLinks / 2

const calculateNextUrl = (currentPage: number, numberOfPages: number, url: URL): string => {
  const newPage = currentPage === numberOfPages - 1 ? currentPage : currentPage + 1
  url.searchParams.set('page', `${newPage}`)
  return url.href
}

const calculatePreviousUrl = (currentPage: number, url: URL): string => {
  const newPage = currentPage > 0 ? currentPage - 1 : 0
  url.searchParams.set('page', `${newPage}`)
  return url.href
}

const useLowestNumber = (left:number, right: number): number => (left >= right ? right : left)

const calculateFrom = (numberOfPages: number, currentPage: number): number => {
  if (numberOfPages <= maxNumberOfPageLinks) {
    return 0
  }
  const towardsTheEnd = numberOfPages - currentPage <= pageBreakPoint
  if (towardsTheEnd) {
    return numberOfPages - maxNumberOfPageLinks
  }
  return currentPage <= pageBreakPoint ? 0 : currentPage - pageBreakPoint
}

export type PaginationRequest = {
  totalResults: number
  currentPage: number
  limit: number
}

export type PaginationResponse = {
  items: any
  previous: PageLink
  next: PageLink
  results: any
  classes: string
}

export type PageLink = {
  text: string
  href: string
}

export const getPagination = (args: PaginationRequest, url: URL): PaginationResponse => {

  const toPageNumberNode = (requestedPage: number): { text: string, href: string, selected: boolean } => {
    url.searchParams.set('page', `$requestedPage`)
    return {
      text: `${requestedPage + 1}`,
      href: url.href,
      selected: requestedPage === args.currentPage,
    }
  }

  const numberOfPages = Math.ceil(args.totalResults / args.limit)

  const allPages = numberOfPages > 0 && [...Array(numberOfPages).keys()]

  const from = calculateFrom(numberOfPages, args.currentPage)

  const to = numberOfPages <= maxNumberOfPageLinks
      ? numberOfPages
      : useLowestNumber(from + maxNumberOfPageLinks, allPages.length)

  const pageList = (numberOfPages > 1 && allPages.slice(from, to)) || []

  const previousPage = numberOfPages > 1
      ? {
        text: 'Previous',
        href: calculatePreviousUrl(args.currentPage, url),
      } as PageLink
      : undefined

  const nextPage = numberOfPages > 1
      ? {
        text: 'Next',
        href: calculateNextUrl(args.currentPage, numberOfPages, url),
      } as PageLink
      : undefined

  return {
    items: pageList.map(toPageNumberNode),
    previous: previousPage,
    next: nextPage,
    results: {
      from: args.currentPage * args.limit + 1,
      to: numberOfPages > 1 && args.currentPage + 1 < numberOfPages ? (args.currentPage + 1) * args.limit : args.totalResults,
      count: args.totalResults,
    },
    classes: 'govuk-!-font-size-19',
  } as unknown as PaginationResponse
}
