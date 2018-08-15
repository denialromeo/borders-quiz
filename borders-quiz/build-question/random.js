// Taken from http://web.archive.org/web/20120326084113/http://www.merlyn.demon.co.uk/js-shufl.htm

// Swap two indices in an array.
Array.prototype.swap = function(j, k) {
    var t = this[j] ; this[j] = this[k] ; this[k] = t
}

// A random number from [0, x)
function random(x) {
    return Math.floor(x * Math.random())
}

// Returns a random item from an array.
function choice(a) {
    return a[random(a.length)]
}

// Shuffles an array and returns it.
function shuffle(a) {
    for (let i = 0; i < a.length; i += 1) {
        a.swap(i, random(i + 1))
    }
    return a
}

// Returns k random items from an array.
// If k > a.length, returns shuffled a.
function sample(a, k) {
    return shuffle(a).slice(0, k)
}

// Exports
Object.assign(exports, {
    shuffle: shuffle,
    choice: choice,
    sample: sample
})