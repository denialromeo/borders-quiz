const $ = require("jquery")
const URI = require("urijs")

const game_settings = Object.freeze(require("./game-settings.json"))
const quiz_modes = Object.freeze(require("./quiz-modes.json"))
const { quiz_mode_of } = require("../build-question/build-question.js")

const google_maps_api_key = "AIzaSyBg5esZrKJYIXrvFfgu1TIApJupbEPmcTk"

/**
 * Polls the Google Maps Geocode API with the given address and returns the response.
 * @param {string} address The address to be mapped.
 */
function geocode(address) {
    const url = "https://maps.googleapis.com/maps/api/geocode/json"
    var json = {}
    $.ajax({ url: url, data: { key: google_maps_api_key, address: address }, async: false, success: r => json = r })
    return Object.freeze(json)
}

/**
 * Returns the latitude and longitude of the given address.
 * @param {string} quiz_mode The key to look up the proper fusion table map.
 * @param {string} address The address to be mapped.
 */
function coordinates(quiz_mode, address) {
    if (address in game_settings.recenter_map_address) {
        address = game_settings.recenter_map_address[address]
    }
    else if (address in game_settings.recenter_map_coordinates) {
        return game_settings.recenter_map_coordinates[address]
    }
    else if (quiz_mode_of(address) === quiz_mode) {
        address += quiz_modes[quiz_mode].geocode_append
    }
    const geocode_api_response = geocode(address)
    if (geocode_api_response.results.length === 0) {
        throw "Invalid location!"
    }
    return Object.freeze(geocode_api_response.results[0].geometry.location)
}

/**
 * Returns the zoom level of the final Google map (0-18).
 * @param {string} quiz_mode The key to look up the proper fusion table map.
 * @param {string} territory The address to be mapped.
 * @param {Object} url_parameters The key-value pairs passed into the URL.
 * @param {boolean} start_map_screen Whether this map is at the start of the quiz or after a question has been answered.
 * @param {boolean} on_mobile_device Whether the quiz is being browsed from a mobile device.
 */
function google_maps_zoom_level(quiz_mode, territory, url_parameters, start_map_screen, on_mobile_device) {
    if (start_map_screen && !isNaN(url_parameters["start-zoom"])) {
        return url_parameters["start-zoom"]
    }
    var possible_zoom_levels = [game_settings.custom_zoom_levels[territory], quiz_modes[quiz_mode].default_zoom_level]
    var zoom_level = possible_zoom_levels.find(zl => !isNaN(zl))
    if (on_mobile_device && zoom_level > 2) {
        zoom_level -= 1
    }
    return zoom_level
}

/**
 * Returns the embedded map URL to be displayed to the user.
 * @param {string} quiz_mode The key to look up the proper fusion table map.
 * @param {string} territory The address to be mapped.
 * @param {Object} url_parameters The key-value pairs passed into the URL.
 * @param {boolean} start_map_screen Whether this map is at the start of the quiz or after a question has been answered.
 * @param {boolean} on_mobile_device Whether the quiz is being browsed from a mobile device.
 */
function map_embed_url(quiz_mode, territory, url_parameters, start_map_screen, on_mobile_device) {
    var url = new URI(quiz_modes[quiz_mode].map_embed_base_url)
    const { lat, lng } = coordinates(quiz_mode, territory)
    return url.addSearch({ lat: lat, lng: lng, z: google_maps_zoom_level(quiz_mode, territory, start_map_screen, on_mobile_device) }).toString()
}

// Exports
Object.assign(exports, {
    map_embed_url: map_embed_url
})