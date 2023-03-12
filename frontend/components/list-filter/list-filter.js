ActivitiesFrontend.ListFilter = function (container) {
  this.container = container

  new MOJFrontend.FilterToggleButton({
    startHidden: true,
    toggleButton: {
      container: document.getElementsByClassName('.moj-action-bar__filter'),
      showText: 'Show filter',
      hideText: 'Hide filter',
      classes: 'govuk-button--secondary',
    },
    closeButton: {
      container: document.getElementsByClassName('.moj-filter__header-action'),
      text: 'Close',
    },
    filter: {
      container: document.getElementsByClassName('.moj-filter'),
    },
  })
}
