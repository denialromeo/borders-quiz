class Timer {
    constructor() {
        this.seconds_elapsed = 0
    }
    get formatted_time() {
        var hours   = Math.floor(this.seconds_elapsed/60/60)
        var minutes = Math.floor(this.seconds_elapsed/60) % 60
        var seconds = this.seconds_elapsed % 60
        function pad_zero(num) {
            return num < 10 ? `0${num}` : num.toString()
        }
        var time = `${pad_zero(minutes)}:${pad_zero(seconds)}`
        return hours > 0 ? `${pad_zero(hours)}:${time}` : time
    }
    start_timer(timer_callback) {
        clearInterval(this.timer_process_id)
        // Code taken from https://stackoverflow.com/questions/2749244/javascript-setinterval-and-this-solution
        this.timer_process_id = setInterval(
                                    (self => function() {
                                        self.seconds_elapsed += 1
                                        timer_callback(self.formatted_time)
                                    })(this),
                                1000)
    }
    pause_timer() {
        clearInterval(this.timer_process_id)
    }
}

// Exports
Object.assign(exports, {
    Timer: Timer
})