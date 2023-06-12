export default function BackLink(backLink) {
  this.backLink = backLink

  this.backLink.addEventListener('click', e => {
    const urlParams = new URLSearchParams(window.location.search)
    const preserveHistory = Boolean(urlParams.get('preserveHistory'))

    if (preserveHistory) {
      e.preventDefault()
      if (document.getElementsByClassName('govuk-error-summary__list').length > 0) {
        window.history.go(-2)
      } else {
        window.history.go(-1)
      }
    }
  })
}
