/**
 * MessageController
 *
 * @description :: Server-side logic for managing messages
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');
var gcm = require('node-gcm');

var sender = new gcm.Sender('AIzaSyAl4WOCFcJvANXoMeSd1JK0r7bFckgLfGk');

module.exports = {
	createRecord: function (req, res) {
		var Model = actionUtil.parseModel(req);
		var data = actionUtil.parseValues(req);
		Model.create(data).exec(function created (err, newInstance) {
			if (err) return res.negotiate(err);
			if (req._sails.hooks.pubsub) {
				if (req.isSocket) {
					Model.subscribe(req, newInstance);
					Model.introduce(newInstance);
				}

				var message = new gcm.Message();

				message.addData('message', newInstance.text);

				Device.find({}, function(err, devices) {
					if(devices === undefined) return res.notFound();
					if (err) return next(err);

					var registrationIds = [];

					for(var i = 0; i < devices.length; i++) {
						var device = devices[i];
						registrationIds.push(device.token);
					}
					
					
					sender.send(message, registrationIds, function (err, result) {
					if(err) console.error(err);
					else    console.log(result);
					});

					Model.publishCreate(newInstance, !req.options.mirror && req);
				});
			}
			res.created(newInstance);
		});
	}
};
