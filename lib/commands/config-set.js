exports.desc = 'Set bbdev configuration parameter';

exports.run = function(opts, callback) {
    var args = opts.argv.remain;

    // if we only have one argument, split on =
    if (args.length === 1) {
        args = args[0].split('=');
    }

    console.log(args);
};