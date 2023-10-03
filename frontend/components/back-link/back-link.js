export default function BackLink(backLink) {
  this.backLink = backLink

  const init = () => {
    if (window.history.length === 1) this.backLink.remove()
  }

  this.backLink.addEventListener('click', e => {
    e.preventDefault()
    if (document.getElementsByClassName('govuk-error-summary__list').length > 0) {
      window.history.go(-2)
    } else {
      window.history.go(-1)
    }
  })

  init()
}
