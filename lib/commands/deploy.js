var tasks = require('../tasks'),
    out = require('out');

exports.desc = 'Deploy previously generated output files to the device';

exports.args = {
    device: String
};

// export runner
exports.run = function(opts, callback) {
    tasks.run(['deploy'], process.cwd(), opts).on('complete', function(err) {
        if (err) return out.error(err);

    });
};