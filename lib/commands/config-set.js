var config = require('../config');

exports.desc = 'Set bbdev configuration parameter';

exports.run = function(opts, callback) {
    var args = opts.argv.remain;

    // if we only have one argument, split on =
    if (args.length === 1) {
        args = args[0].split('=');
    }

    // load the config, apply the changed setting and then save the config
    config.load(function(cfg) {
        cfg[args[0]] = args[1] || '';

        // save the configuration
        config.save(cfg, callback);
    });
};