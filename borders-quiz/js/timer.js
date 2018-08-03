var timer_process_id

function pad_zero(num) {
    return (num < 10 ? "0" + num : num)
}

function format_time(raw_date) {
    var total_seconds = Math.round(raw_date/1000)
    var hours = Math.floor(total_seconds/60/60)
    var minutes = Math.floor((total_seconds/60) % 60)
    var seconds = Math.floor(total_seconds % 60)
    var time = pad_zero(minutes) + ":" + pad_zero(seconds)
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
    clearInterval(timer_process_id)
    timer_process_id = setInterval(function() { update_dom_time(start_time, timer_dom_node) }, 1000)
}

// Exports
Object.assign(exports, {
    time_elapsed: time_elapsed,
    start_timer: start_timer
})