/*jslint unparam: true, node: true, plusplus: true, nomen: true, indent: 2, todo: true */
'use strict';

var Mailer        = require('../lib/mailer');
var BookingModel  = require('../models/booking');
var GadgetModel   = require('../models/gadget');
var moment        = require('moment');


/**
 * Searches for expired bookings and sends a notification mail to odlthek owners
 */
function findExpiredBookings() {

  var where = {
    status: { $ne: 'closed' },
    end: { $lt: new Date() },
  };

  if(moment().format('09:00') == moment().format('HH:mm')) {
    BookingModel.find({$and:[where,{notificationSent:true}]},function(err,bookings) {
      bookings.forEach(function (booking) {
        booking.notificationSent = 'false';
        booking.save();
      });
    });
  }

  BookingModel.find({$and:[where,{notificationSent: { $ne: true }}]}, function (err, bookings) {
    bookings.forEach(function (booking) {
      
      //update status
      booking.status = 'overdrawn';
      booking.save();

      //send notification      
      if(booking.notificationSent == false) {
        Mailer.sendBookingExpiredMail({
          userId: booking.user,
          gadgetId: booking.gadget,
          booking: booking
        }, function () {
          // update booking to make sure notification mail is sent only once
          booking.notificationSent = 'true';
          booking.save();
        });
      }
    });
  });
}


var Cron = {

  start: function () {
    this.interval = setInterval(function () {

      findExpiredBookings();

    // run every minute
    }, 60000);
  },

  stop: function () {
    clearInterval(this.interval);
  }

};

module.exports = Cron;