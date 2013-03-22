var debug = require('debug')('worx'),
    tasks = require('../tasks'),
    out = require('out');

exports.desc = 'Build the current project';

exports.args = {
    signingPass: String
};

// export runner
exports.run = function(opts, callback) {
    debug('starting the build task');
    tasks.run(['build'], process.cwd(), opts).on('complete', function(err) {
        if (err) return out.error(err);

    });
};