function AppointmentEndDate(container) {
  if (!container.dataset.startDate) return

  var endDateContainer = document.querySelector('.js-appointment-end-date')

  var repeatTimesInput = container.querySelector('#repeatCount')
  var repeatPeriodInputs = container.querySelectorAll('input[name=repeatPeriod]')

  function updateEndDate() {
    var repeatPeriodSelectedInput = container.querySelector('input[name=repeatPeriod]:checked')
    var appointments = parseInt(repeatTimesInput.value)

    if (!repeatPeriodSelectedInput || isNaN(appointments) || appointments < 1) {
      endDateContainer.innerHTML = ''
      return
    }

    var startDate = new Date(container.dataset.startDate)
    var repeatPeriod = repeatPeriodSelectedInput.value

    var endDate = calculateEndDate(startDate, repeatPeriod, appointments)

    const dateOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }

    endDateContainer.innerHTML = '<div class="secondary-text-colour">Last appointment on</div>'
    endDateContainer.innerHTML += `<b>${endDate.toLocaleString('en-GB', dateOptions)}</b>`
  }

  repeatTimesInput.addEventListener('keyup', updateEndDate)
  for (var i = 0; i < repeatPeriodInputs.length; i++) {
    repeatPeriodInputs[i].addEventListener('change', updateEndDate)
  }
}

export function calculateEndDate(startDate, repeatPeriod, appointments) {
  var endDate = new Date(startDate)

  // If the is only one appointment then no calculation is needed, the
  // end date is the start date
  if (appointments > 1) {
    var date = endDate.getDate()

    if (repeatPeriod == 'WEEKDAY') {
      // Account for starting on a weekend
      if (startDate.getDay() == 0 || startDate.getDay() == 6) {
        // If the start date is on a weekend we can pretend the first
        // appointment is on the Friday before to keep our calculations happy
        if (startDate.getDay() == 0) date -= 2
        else if (startDate.getDay() == 6) date -= 1
        endDate.setDate(date)
      }

      // Ignore the first appointment as it's the start day
      appointments -= 1

      // Calculate the number of weeks to add to the start date
      var weeksToAdd = Math.floor(appointments / 5)
      date += weeksToAdd * 7

      // Calculate the remaining days to add
      var remainingDaysToAdd = Math.floor(appointments % 5)
      date += remainingDaysToAdd

      // Account for skipping over weekends
      if (endDate.getDay() + remainingDaysToAdd >= 6) date += 2
    } else if (repeatPeriod == 'DAILY') {
      date += appointments - 1
    } else if (repeatPeriod == 'WEEKLY') {
      date += Math.floor(appointments - 1) * 7
    } else if (repeatPeriod == 'FORTNIGHTLY') {
      date += Math.floor(appointments - 1) * 14
    } else if (repeatPeriod == 'MONTHLY') {
      var month = endDate.getMonth()
      month += Math.floor(appointments - 1)
      endDate.setMonth(month)

      // When setting the month, if the day doesn't exist for updated date
      // (eg, 30 Feb) then JS moves to the next month and adds any excess days
      // (eg, 30 Feb -> 2 March).
      // We want to use the last day instead (eg, 30 Feb -> 28 Feb)
      if (date > endDate.getDate()) date = 0
    }

    endDate.setDate(date)
  }

  return endDate
}

export default AppointmentEndDate
