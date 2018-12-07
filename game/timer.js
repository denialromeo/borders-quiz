class Timer {
    /**
     * Represents a timer.
     */
    constructor() {
        this.seconds_elapsed = 0
    }
    /**
     * Get the current time elapsed as a formatted string.
     */
    get formatted_time() {
        function pad_zero(num) { return (num < 10 ? `0${num}` : num.toString()) }
        const hours   = pad_zero(Math.floor(this.seconds_elapsed/60/60))
        const minutes = pad_zero(Math.floor(this.seconds_elapsed/60) % 60)
        const seconds = pad_zero(this.seconds_elapsed % 60)
        return (hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`)
    }
    /**
     * Executes the given callback once every second.
     * @param {function} timer_callback The callback to run - should take the formatted time as its only parameter.
     */
    start(timer_callback) {
        clearInterval(this.timer_process_id)
        const bound_callback = (self => function() { self.seconds_elapsed += 1; timer_callback(self.formatted_time) })(this)
        this.timer_process_id = setInterval(bound_callback, 1000)
    }
    /**
     * Stops timing.
     */
    pause() {
        clearInterval(this.timer_process_id)
    }
}

// Exports
Object.assign(exports, {
    Timer: Timer
})