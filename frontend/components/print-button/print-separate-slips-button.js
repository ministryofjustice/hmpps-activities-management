function PrintSeparateSlipsButton(button) {
  this.printSeparateSlipsButton = button

  this.printSeparateSlipsButton.addEventListener('click', e => {
    e.preventDefault()
    let slips = document.querySelectorAll('.movement-slip')
    slips.forEach(slip => slip.classList.add('separate-slip-print'))
    window.print()
    slips.forEach(slip => slip.classList.remove('separate-slip-print'))
  })
}

export default PrintSeparateSlipsButton
