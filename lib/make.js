var QFS = require('q-io/fs'),
    PATH = require('path'),
    VM = require('vm'),
    _ = require('underscore'),
    Q = require('q');

exports.process = function (root) {
    var rootMakefile = PATH.join(root, '.bem', 'make.js');
    return evalMakeFile(getMakeFile(rootMakefile), rootMakefile)
        .then(function () {
            return mockedMake;
        });
};

function getMakeFile (rootMakefile) {
    return QFS.exists(rootMakefile)
        .then(function (exists) {
            return exists ? QFS.read(rootMakefile) : '';
        });
}

function evalMakeFile (content, path) {
    //todo : implement variants when no makefile / no content / dirs are not listed directly
    return Q.when(content, function (content) {

        var resolvePath = getPathResolver(path),
            requireFunc = getRequireFunc(resolvePath);

        // let require.resolve() to work in make.js modules
        requireFunc.resolve = resolvePath;

        VM.runInNewContext(
            content,
            _.extend({}, global, {
                MAKE: mockedMake,
                module: null,
                __filename: path,
                __dirname: PATH.dirname(path),
                require: requireFunc
            }),
            path);
    });
}

function getRequireFunc (resolvePath) {
    return function (path) {
        return require(resolvePath(path));
    }
}

function getPathResolver (base) {
    return function (path) {
        return path.match(/^\./) ? PATH.resolve(PATH.dirname(base), path) : path;
    }
}

var mockedMake = {

    decl: function (name, object) {
        this[name] = this[name] ? _.extend(this[name], object) : object;
    },

    BundlesLevelNode: {
        mergedBundleName: function () {
            return 'merged'
        }
    }
};
