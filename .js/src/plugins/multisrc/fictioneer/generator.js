"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAll = void 0;
var fs_1 = require("fs");
var url_1 = require("url");
var path_1 = require("path");
var folder = (0, path_1.dirname)((0, url_1.fileURLToPath)(import.meta.url));
var sources_json_1 = __importDefault(require("./sources.json"));
var generateAll = function () {
    return sources_json_1.default.map(function (source) {
        console.log("[fictioneer] Generating: ".concat(source.id).concat(' '.repeat(20 - source.id.length)));
        return generator(source);
    });
};
exports.generateAll = generateAll;
var generator = function generator(source) {
    var _a, _b, _c;
    var readNovelFullTemplate = (0, fs_1.readFileSync)((0, path_1.join)(folder, 'template.ts'), {
        encoding: 'utf-8',
    });
    var chapterTransformJsOrPath = (_b = (_a = source.options) === null || _a === void 0 ? void 0 : _a.customJs) === null || _b === void 0 ? void 0 : _b.chapterTransform;
    var chapterTransformPath = chapterTransformJsOrPath
        ? (0, path_1.join)(folder, chapterTransformJsOrPath)
        : '';
    var chapterTransformJs = (0, fs_1.existsSync)(chapterTransformPath)
        ? (0, fs_1.readFileSync)(chapterTransformPath, { encoding: 'utf-8' })
        : chapterTransformJsOrPath;
    var pluginScript = "\n".concat(readNovelFullTemplate.replace('// chapterTransformJs HERE', chapterTransformJs || ''), "\nconst plugin = new FictioneerPlugin(").concat(JSON.stringify(source), ");\nexport default plugin;\n    ").trim();
    return {
        lang: ((_c = source.options) === null || _c === void 0 ? void 0 : _c.lang) || 'English',
        filename: source.sourceName,
        pluginScript: pluginScript,
    };
};
