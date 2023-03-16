ActivitiesFrontend.BackLink = function (backLink) {
  this.backLink = backLink

  this.backLink.addEventListener('click', e => {
    e.preventDefault()
    if (document.getElementsByClassName('govuk-error-summary__list').length > 0) {
      window.history.go(-2)
    } else {
      window.history.go(-1)
    }
  })
}
