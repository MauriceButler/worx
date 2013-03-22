var debug = require('debug')('worx'),
    tasks = require('./tasks'),
    out = require('out');

// export runner
exports.run = function(opts, callback) {
    var task = opts.argv.cooked[0],
        runner = tasks.run.apply(null, [[task], process.cwd(), opts]);

    debug('starting the ' + task + ' task');
    runner.on('complete', function(err) {
        if (err) return out.error(err);

    });
};