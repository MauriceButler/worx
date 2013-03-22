var config = require('../config'),
    out = require('out'),
    prompt = require('prompt');

exports.desc = 'Register a device configuration';

exports.run = function(opts, callback) {
    var args = opts.argv.remain,
        deviceName = args[0];

    // if we don't have a devicename, then abort with an error
    if (! deviceName) {
        callback(new Error('A device name is required for the register-device command: worx register-device %name%'));
    }

    // load the config, apply the changed setting and then save the config
    config.load(function(cfg) {
        // ensure we have a devices node within the configuration 
        cfg.devices = cfg.devices || {};

        out('Please provide the device ip and development mode password:');

        // TODO: add validation rules
        prompt.get(['ip', 'password'], function(err, result) {
            if (err) return callback(err);

            // update the configuration and save
            cfg.devices[deviceName] = result;
            config.save(cfg, callback);
        });
    });
};