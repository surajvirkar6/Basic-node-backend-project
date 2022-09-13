const mongoose = require('mongoose');

const event = new mongoose.Schema({
    eventName: {
        type: String,
    },
    eventDate: {
        type: String,
    }, 
    eventDescription: {
        type: String,
    },
    users: {
        type: Array,
    }
},);

const Event = mongoose.model('Event', event);

module.exports = Event;