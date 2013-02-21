var path = require('path'),
    _ = require('underscore'),
    homePath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'],
    configFile = path.resolve(homePath, '.bbdev'),

    defaultConfig = {
        deviceIp: '169.254.0.1'
    },

    config;

// load the configuration from the home directory
exports.load = function(callback) {
    // if the configuration is already loaded, then return it immediately
    if (config) return callback(config);

    // load the configuration file
    fs.readFile(configFile, 'utf8', function(err, data) {
        // initialise the config
        try {
            config = JSON.parse(data || '{}');
        }
        catch (e) {
            config = {};
        }

        // apply defaults to the config and trigger the callback
        callback(_.defaults(config, defaultConfig));
    });
};