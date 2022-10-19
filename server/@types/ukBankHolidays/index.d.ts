declare module '@hmcts/uk-bank-holidays' {
  export default class HolidayFeed {
    constructor(divisions: string[])

    async load(): Promise<string[]>
  }
}
