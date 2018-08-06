// Taken from http://web.archive.org/web/20120326084113/http://www.merlyn.demon.co.uk/js-shufl.htm

// Swap two indices in an array.
Array.prototype.swap = function(j, k) {
  var t = this[j] ; this[j] = this[k] ; this[k] = t
}

// A random number from 0 to x, inclusive.
function random(x) {
  return Math.floor(x*(Math.random()%1))
}

// Shuffles an array and returns it.
function shuffle(a) {
    for (let i=a.length-1; i>0; i--) {
        a.swap(i, random(i+1))
    }
    return a
}

// Selects a random item from an array.
function choice(a) {
    return a[random(a.length)]
}

// Selects k random items from an array.
function sample(a, k) {
    for (let i=0; i < a.length; i++) {
        a.swap(i, random(a.length))
    }
    return a.slice(0,k)
}

// Exports
Object.assign(exports, {
    shuffle: shuffle,
    choice: choice,
    sample: sample
})