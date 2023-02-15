ActivitiesFrontend.PrintButton = function (button) {
  this.printButton = button

  this.printButton.addEventListener('click', e => {
    e.preventDefault()
    window.print()
  })
}
