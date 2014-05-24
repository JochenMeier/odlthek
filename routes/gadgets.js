var express = require('express');
var helper = require('../helper.js');
var gadgets = helper.db.collection('gadgets');
var bookings = helper.db.collection('bookings');
var users = helper.db.collection('users');

var router = express.Router();

router.get('/', helper.ensureAuthenticated,  function(req, res) {
  gadgets.find({ type :  "mobile" }).sort({brand:1}).toArray(function(_err,_result){
    if(_result&&_result!=undefined&&_result.length) {	  
		bookings.find({ start: {$lte: new Date()}, end: {$gte: new Date()} }).toArray(function(_err,_booked_result){
			if(_booked_result&&_booked_result!=undefined) {
				//console.log(_booked_result[0]);
				//console.log(_result[0]);
				for(i = 0;i < _result.length;i++) {
					_result[i].booked = false;
					_result[i].handout = false;
					_result[i].lastuser = false;
					//bookings.find({ gadget:_result[i]._id }).sort({end:-1}).limit(1).toArray(function(_err,_last_booking_result){
					//	if(_last_booking_result&&_last_booking_result!=undefined&&_last_booking_result.length) {
					//		console.log(_last_booking_result[0]);
					//		_result[i].lastuser = _last_booking_result[0].username;
					//	}
					//})
					for(j = 0;j < _booked_result.length;j++) {
						if(_result[i]._id == _booked_result[j].gadget && _booked_result[j].status == "handout") {
							_result[i].handout = true;
							users.findById( _booked_result[j].user, function(_err,_users_result){
								if(_users_result&&_users_result!=undefined&&_users_result.length) {
									if(_users_result[0].name) {
										_result[i].lastuser = _users_result[0].name;
									} else if (_users_result[0].displayname) {
										_result[i].lastuser = _users_result[0].name;
									}
								}
							});
						} else if(_result[i]._id == _booked_result[j].gadget){
							_result[i].booked = true;
							users.findById( _booked_result[j].user, function(_err,_users_result){
								if(_users_result&&_users_result!=undefined&&_users_result.length) {
									if(_users_result[0].name) {
										_result[i].lastuser = _users_result[0].name;
									} else if (_users_result[0].displayname) {
										_result[i].lastuser = _users_result[0].name;
									}
								}
							});
						}
					}
				}	
			}
			res.render('gadgets/list', { title: 'Gadgets: '+_result.length, gadgets : _result});  
		})
    } else {
      res.render('index', { title: 'No devices' });  
    }
  })
});



router.get('/find/', helper.ensureAuthenticated, function(req, res) {
  gadgets.find({ "name" : {$regex : ".*"+req.query.q+".*", $options: 'i'}}).sort({brand:1}).toArray(function(_err,_result){
    res.render('gadgets/list', { title: 'Gadgets: '+_result.length, gadgets : _result}); 
  });
});

router.get('/:id', helper.ensureAuthenticated, helper.ensureAdmin, function(req, res) {
  gadgets.findById(req.params.id,function(_err,_gadget){
    bookings.find({gadget : _gadget._id.toString()}).toArray(function(_err,_bookings){
      for(var i = 0 ; i < _bookings.length ; i++) {
        _bookings[i].startdate = helper.prettyDate(_bookings[i].start);
        _bookings[i].enddate = helper.prettyDate(_bookings[i].end);
      }
      res.render('gadgets/detail', { title: _gadget.name , gadget : _gadget, bookings : _bookings });  
    })
  })
});


router.get('/:id/edit', helper.ensureAuthenticated, helper.ensureAdmin, function(req, res) {
  gadgets.findById(req.params.id,function(_err,_gadget){
    res.render('gadgets/edit', { title: _gadget.name , gadget : _gadget});  
  })
});



router.post('/:id/upload', helper.ensureAuthenticated, helper.ensureAdmin, function(req, res) {
  gadgets.findById(req.params.id,function(_err,_gadget){
    _gadget.image = req.files.image.path.replace(/public\//,'');
    gadgets.save(_gadget,function(_err,_result){
      res.render('gadgets/edit', { title: _gadget.name , gadget : _gadget});  
    })
  })
});




router.post('/:id/edit', helper.ensureAuthenticated, helper.ensureAdmin, function(req, res) {
  gadgets.findById(req.params.id,function(_err,_gadget){
    for(var key in req.body) {
      _gadget[key] = req.body[key];
    }
    gadgets.save(_gadget,function(_err,_result){
       res.redirect('/gadgets/'+_gadget._id+'/edit');
    }) 
  })
});

module.exports = router;
