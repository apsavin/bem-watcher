var MAKE = require('./make.js'),
    CRAWLER = require('./crawler.js'),
    Watcher = require('./watcher.js').Watcher,
    REBUILDER = require('./rebuilder.js'),
    PATH = require('path'),
    _ = require('underscore'),
    QFS = require('q-io/fs'),
    watcher = new Watcher(),
    FS = require('fs');

exports.run = function (opts) {
    MAKE.process(opts.root).then(function (make) {

        correctOptsDirectory(opts, make);

        REBUILDER.setEnv(opts);

        make.Arch.getBlocksLevels().forEach(watch);

        opts.directory.forEach(function (path) {
            findBuildTechFileAndWatchIt(path);
            var blocksDir = PATH.join(path, 'blocks');
            QFS.exist(blocksDir)
                .then(function (exists) {
                    if (exists) {
                        watch(blocksDir);
                    }
                });
        });
    });
};

function correctOptsDirectory (opts, make) {
    if (opts.directory.length) {
        var findedMergedBundles = [];
        make.Arch.getBundlesLevels().forEach(function (level) {
            if (make.BundlesLevelNode.buildMergedBundle.call({
                getLevelPath: function () {
                    return level;
                }
            })) {
                findedMergedBundles.push(PATH.join(level, make.BundlesLevelNode.mergedBundleName()))
            }
        });
        opts.directory = _.union(opts.directory, findedMergedBundles);
    }
    else {
        var findedBundles = [];
        make.Arch.getBundlesLevels().forEach(function (level) {
            var bundles = CRAWLER.collectFilesAndDirs(level).dirs.filter(function (path) {
                return path !== level && !/blocks/.test(path);
            });
            findedBundles = findedBundles.concat(bundles);
        });
        opts.directory = findedBundles;
    }
}

watcher.on('changed', REBUILDER.fileChangesCallback);

watcher.on('added', REBUILDER.fileAddedCallback);

function watch (level) {
    var filesAndDirs = CRAWLER.collectFilesAndDirs(level);
    watcher.watchFiles(filesAndDirs.files);
    watcher.watchDirs(filesAndDirs.dirs);
}

function findBuildTechFileAndWatchIt (path, newDirStructure) {
    var dirStructure = newDirStructure || FS.readdirSync(path),
        buildTechFile = _(dirStructure).find(function (file) {
            return file.match(/bemjson\.js$/);
        }) || _(dirStructure).find(function (file) {
            return file.match(/bemdecl\.js$/);
        });
    if (buildTechFile) {
        watcher.watchFile(PATH.join(path, buildTechFile));
    } else {
        watcher.watch(path).on('change', function (path) {
            var newDirStructure = FS.readdirSync(path),
                diff = _.difference(newDirStructure, dirStructure);
            if (diff.length) {
                findBuildTechFileAndWatchIt(path, newDirStructure);
            }
        });
    }
}