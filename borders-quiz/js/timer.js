var timer_process_id

function prepend_zero(time) {
    return (time < 10 ? "0" + time : time)
}

function format_time(raw_date) {
    var total_seconds = Math.round(raw_date/1000)
    var hours = prepend_zero(Math.floor(total_seconds/60/60))
    var minutes = prepend_zero(Math.floor((total_seconds/60) % 60))
    var seconds = prepend_zero(Math.floor(total_seconds % 60))
    var time = minutes + ":" + seconds
    return (hours > 0 ? hours + ":" + time : time)
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
    if (timer_process_id != undefined) {
        clearInterval(timer_process_id)
    }
    timer_process_id = setInterval(function() { update_dom_time(start_time, timer_dom_node) }, 1000)
}

// Exports
Object.assign(exports, {
    time_elapsed: time_elapsed,
    start_timer: start_timer
})