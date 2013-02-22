var fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    homePath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'],
    configFile = path.resolve(homePath, '.worx'),

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

// load the local configuration settings
exports.loadLocal = function(targetPath, callback) {
    var localConfig = path.resolve(targetPath, 'config.json'),
        cfg;

    fs.readFile(localConfig, 'utf8', function(err, data) {
        try {
            cfg = JSON.parse(data || '{}');
        }
        catch (e) {
            cfg = {};
        }

        callback(_.defaults(cfg, {
            projectName: path.basename(targetPath)
        }));
    });
};

exports.save = function(data, callback) {
    var output;

    // update the configuration
    _.extend(config, data);

    // stringify the data in a sensible format
    output = JSON.stringify(config, null, '  ');

    // save the file
    fs.writeFile(configFile, output, 'utf8', callback);
};