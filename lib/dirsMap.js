var dirsStructures = {};

exports.getDirStructure = function (path) {
    return dirsStructures[path];
};
exports.setDirStructure = function (path, struct) {
    dirsStructures[path] = struct;
};