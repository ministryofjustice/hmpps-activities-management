function PrintButton(button) {
  this.printButton = button

  this.printButton.addEventListener('click', e => {
    e.preventDefault()
    window.print()
  })
}

export default PrintButton
