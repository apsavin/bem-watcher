var fs = require('fs'),
    dirsStructures = {},
    PATH = require('path');

function collectFilesAndDirsRecursively(path) {
    var stat = fs.statSync(path),
        filesAndDirs = {
            files: [],
            dirs: []
        };
    if (stat.isDirectory()) {
        filesAndDirs.dirs.push(path);
        var dirStructure = fs.readdirSync(path);
        setDirStructure(path, dirStructure);
        dirStructure
            .map(correctPath, path)
            .map(collectFilesAndDirsRecursively)
            .forEach(function (_filesAndDirs) {
                filesAndDirs = concat(filesAndDirs, _filesAndDirs);
            });
    } else if (stat.isFile()) {
        filesAndDirs.files.push(path);
    }
    return filesAndDirs;
}

function correctPath(basename) {
    return PATH.join(this.toString(), basename);
}

function findBlocksFilesAndDirsRecursively(path) {
    var stat = fs.statSync(path),
        filesAndDirs = {
            files: [],
            dirs: []
        };
    if (stat.isDirectory()) {
        var currentDir = PATH.basename(path);
        if (currentDir.match(/^blocks/)) {
            filesAndDirs = concat(filesAndDirs, collectFilesAndDirsRecursively(path));
        } else {
            fs.readdirSync(path)
                .map(correctPath, path)
                .map(findBlocksFilesAndDirsRecursively)
                .forEach(function (_filesAndDirs) {
                    filesAndDirs = concat(filesAndDirs, _filesAndDirs);
                });
        }
    }
    return filesAndDirs
}

function concat(filesAndDirs, _filesAndDirs) {
    filesAndDirs.files = filesAndDirs.files.concat(_filesAndDirs.files);
    filesAndDirs.dirs = filesAndDirs.dirs.concat(_filesAndDirs.dirs);
    return filesAndDirs;
}

function dirsFilter(dir) {
    return dir.match(/^blocks|^pages|^bundles/);
}

exports.findBlocksFilesAndDirs = function (path) {
    var stat = fs.statSync(path),
        filesAndDirs = {
            files: [],
            dirs: []
        };
    if (stat.isDirectory()) {
        fs.readdirSync(path)
            .filter(dirsFilter)
            .map(correctPath, path)
            .map(findBlocksFilesAndDirsRecursively)
            .forEach(function (_filesAndDirs) {
                filesAndDirs = concat(filesAndDirs, _filesAndDirs);
            });
    }
    return filesAndDirs;
};

exports.getDirStructure = function (path) {
    return dirsStructures[path];
};

var setDirStructure = exports.setDirStructure = function (path, struct) {
    dirsStructures[path] = struct;
};