var timer_process_id

function pad_zero(num) {
    return num < 10 ? `0${num}` : num.toString()
}

function format_time(milliseconds_elapsed) {
    var seconds_elapsed = Math.round(milliseconds_elapsed/1000)
    var hours = Math.floor(seconds_elapsed/60/60)
    var minutes = Math.floor((seconds_elapsed/60) % 60)
    var seconds = Math.floor(seconds_elapsed % 60)
    var time = `${pad_zero(minutes)}:${pad_zero(seconds)}`
    return hours > 0 ? `${hours}:${time}` : time
}

function time_elapsed(start_time) {
	return format_time(Date.now() - start_time)
}

function update_dom_time(start_time, timer_dom_node) {
    if (timer_dom_node != undefined) {
        timer_dom_node.innerHTML = time_elapsed(start_time)
    }
}

// Given a node in the DOM tree and the start time as a Date, periodically updates it.
function start_timer(start_time, timer_dom_node) {
    clearInterval(timer_process_id)
    timer_process_id = setInterval(function() { update_dom_time(start_time, timer_dom_node) }, 1000)
}

// Exports
Object.assign(exports, {
    time_elapsed: time_elapsed,
    start_timer: start_timer
})