var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    fstream = require('fstream'),
    task = require('taskify'),
    out = require('out'),
    spawn = require('child_process').spawn,
    config = require('./config'),
    reIgnoreFiles = /^(\.git|node_modules|Jakefile|\.DS_Store|template|output|lib|package.json)/,
    ignoreExtensions = ['.DS_Store', '.bar', '.zip'],
    projectFiles = [];

// discover the nature of the project through 
task('discovery', function(targetPath) {
    var reader = fstream.Reader({
            path: targetPath,
            filter: function(entry) {
                var testPath = entry.path.slice(targetPath.length + 1),
                    shouldIgnore = reIgnoreFiles.test(testPath);

                return ! (shouldIgnore || ignoreExtensions.indexOf(path.extname(entry.path)) >= 0);
            }
        });
        
    reader.on('child', function(entry) {
        if (entry.type === 'File') {
            projectFiles.push(entry.path);
        }
    });
    
    reader.on('end', this.async());
    out('!{bold}analyzing project structure');
});

task('prepare', function(targetPath) {
    mkdirp(path.resolve(targetPath, 'output'), this.async());
});

task('package', ['discovery', 'prepare'], function(targetPath) {
    var done = this.async(),
        basePath = path.resolve(targetPath),
        relativeFiles, proc;

    // load the local config
    config.loadLocal(targetPath, function(cfg) {
        var targetFile = path.join('output', cfg.projectName + '.zip'),
            args = [targetFile];

        relativeFiles = projectFiles.map(function(filename) {
            return filename.slice(basePath.length + 1);
        });

        proc = spawn('zip', args.concat(relativeFiles), {
            cwd: path.resolve(targetPath)
        });

        proc.stdout.on('data', function(buffer) {
            console.log(buffer.toString());
        });
        proc.on('exit', function(code) {
            out('!{bold}zip completed with exit code: ' + code);
            done();
        });

        out('!{bold}creating archive');
    });
});

exports.run = task.run;