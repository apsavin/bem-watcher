var fs = require('fs'),
    PATH = require('path'),
    http = require('http'),
    _ = require('underscore'),
    URL = require('url'),
    urlObject = {
        protocol: 'http',
        hostname: 'localhost'
    };

function collectFilesRecursively(path) {
    var stat = fs.statSync(path),
        files = [];
    if (stat.isDirectory()) {
        fs.readdirSync(path)
            .map(correctPath, path)
            .map(collectFilesRecursively)
            .forEach(function (arr) {
                files = files.concat(arr);
            });
    } else if (stat.isFile()) {
        files.push(path);
    }
    return files;
}
function correctPath(basename) {
    return PATH.join(this.toString(), basename);
}

function _findAllTechFiles(path) {
    var stat = fs.statSync(path),
        files = [];
    if (stat.isDirectory()) {
        var currentDir = PATH.basename(path);
        if (currentDir.match(/^blocks/)) {
            files = files.concat(collectFilesRecursively(path));
        } else {
            fs.readdirSync(path)
                .map(correctPath, path)
                .map(_findAllTechFiles)
                .forEach(function (arr) {
                    files = files.concat(arr);
                });
        }
    }
    return files;
}
function dirsFilter(dir) {
    return dir.match(/^blocks|^pages|^bundles/);
}
function findAllTechFiles(path) {
    var stat = fs.statSync(path),
        files = [];
    if (stat.isDirectory()) {
        fs.readdirSync(path)
            .filter(dirsFilter)
            .map(correctPath, path)
            .map(_findAllTechFiles)
            .forEach(function (arr) {
                files = files.concat(arr);
            });
    }
    return files;
}

function watchFileLater(file) {
    rebuildPages();
    setTimeout(function () {
        watch(file);
    }, 1000);
}

rebuildPages = _.debounce(function () {
    http.get(URL.format(urlObject)).on('error', function (err) {
        console.log(err);
    });
}, 100);

function watch(file) {
    try {
        var watcher = fs
            .watch(file)
            .on('change', _.debounce(function () {
                watcher.close();
                watchFileLater(file);
            },
            500))
            .on('error', function (e) {
                console.log(e);
            });
    } catch (e) {
        watchFileLater(file);
    }
}
exports.watch = function (opts) {
    urlObject.port = opts.port;
    urlObject.hostname = opts.host || urlObject.hostname;
    urlObject.pathname = opts.directory;
    findAllTechFiles(opts.root).forEach(watch);
};
