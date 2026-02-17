"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fetch_1 = require("@libs/fetch");
var cheerio_1 = require("cheerio");
var defaultCover_1 = require("@libs/defaultCover");
var novelStatus_1 = require("@libs/novelStatus");
var PanchoPlugin = /** @class */ (function () {
    function PanchoPlugin() {
        this.id = 'panchotranslations';
        this.name = 'Pancho Translations';
        this.icon = "multisrc/madara/panchotranslations/icon.png";
        this.site = 'https://panchonovels.online/';
        this.version = '1.1.6';
    }
    PanchoPlugin.prototype.decodeHtmlEntities = function (value) {
        return value
            .replace(/&quot;|&#34;/g, '"')
            .replace(/&apos;|&#39;/g, "'")
            .replace(/&amp;/g, '&');
    };
    PanchoPlugin.prototype.extractArrayLiteral = function (source, key) {
        // Matches key followed by start of array [, handling quotes and whitespace
        var keyMatch = new RegExp("[\"']?".concat(key, "[\"']?\\s*:\\s*\\[")).exec(source);
        if (!keyMatch)
            return undefined;
        var start = keyMatch.index + keyMatch[0].length - 1; // index of [
        var depth = 0;
        var inString = false;
        var quote = '';
        for (var i = start; i < source.length; i++) {
            var char = source[i];
            var prev = i > 0 ? source[i - 1] : '';
            if (inString) {
                if (char === quote && prev !== '\\') {
                    inString = false;
                }
                continue;
            }
            if (char === '"' || char === "'") {
                inString = true;
                quote = char;
                continue;
            }
            if (char === '[')
                depth++;
            if (char === ']') {
                depth--;
                if (depth === 0) {
                    return source.slice(start, i + 1);
                }
            }
        }
        return undefined;
    };
    PanchoPlugin.prototype.parseNovelsFromSource = function (source) {
        if (!source)
            return [];
        var normalizedSource = this.decodeHtmlEntities(source);
        var novelsLiteral = this.extractArrayLiteral(normalizedSource, 'novels');
        if (!novelsLiteral)
            return [];
        try {
            var novelsData = JSON.parse(novelsLiteral);
            if (!Array.isArray(novelsData))
                return [];
            var novels_1 = [];
            var seen_1 = new Set();
            novelsData.forEach(function (entry) {
                var n = typeof entry === 'object' && entry !== null
                    ? entry
                    : {};
                var slug = typeof (n === null || n === void 0 ? void 0 : n.novelSlug) === 'string' ? n.novelSlug.trim() : '';
                var name = typeof (n === null || n === void 0 ? void 0 : n.novelName) === 'string' ? n.novelName.trim() : '';
                if (!slug || !name)
                    return;
                var path = "novel/".concat(slug);
                if (seen_1.has(path))
                    return;
                seen_1.add(path);
                novels_1.push({
                    name: name,
                    cover: typeof (n === null || n === void 0 ? void 0 : n.novelImg) === 'string' && n.novelImg.trim()
                        ? n.novelImg
                        : defaultCover_1.defaultCover,
                    path: path,
                });
            });
            return novels_1;
        }
        catch (e) {
            return [];
        }
    };
    PanchoPlugin.prototype.getCheerio = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var r, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        r = _b.sent();
                        if (!r.ok)
                            throw new Error('Could not reach site (' + r.status + ') try to open in webview.');
                        _a = cheerio_1.load;
                        return [4 /*yield*/, r.text()];
                    case 2: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
                }
            });
        });
    };
    PanchoPlugin.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var html, $, novels, seen, addNovel, otherNovels, xDataString, allXData, _i, allXData_1, el, data, domNovels;
            var showLatestNovels = _b.showLatestNovels;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (pageNo > 1)
                            return [2 /*return*/, []]; // Site seems to use single page with "Load more"
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + 'home').then(function (res) { return res.text(); })];
                    case 1:
                        html = _c.sent();
                        $ = (0, cheerio_1.load)(html);
                        novels = [];
                        seen = new Set();
                        addNovel = function (novel) {
                            if (!seen.has(novel.path)) {
                                seen.add(novel.path);
                                novels.push(novel);
                            }
                        };
                        // 1. Parse Carousel (Popular) - ONLY if NOT showing latest (Recents)
                        if (!showLatestNovels) {
                            $('div.embla > div.flex > div').each(function (i, el) {
                                var name = $(el)
                                    .find('span.text-white.text-base.font-semibold')
                                    .text()
                                    .trim();
                                var cover = $(el).find('img').attr('src');
                                var path = $(el).find('a').attr('href');
                                if (name && path) {
                                    addNovel({
                                        name: name,
                                        cover: cover || defaultCover_1.defaultCover,
                                        path: path.replace(/^\//, ''),
                                    });
                                }
                            });
                        }
                        otherNovels = [];
                        xDataString = $('[x-data*="novels"][x-data*=":"]')
                            .first()
                            .attr('x-data');
                        // If specific attribute search fails, iterate to find it
                        if (!xDataString) {
                            allXData = $('[x-data]').toArray();
                            for (_i = 0, allXData_1 = allXData; _i < allXData_1.length; _i++) {
                                el = allXData_1[_i];
                                data = $(el).attr('x-data');
                                if (data && /novels\s*:/.test(data)) {
                                    xDataString = data;
                                    break;
                                }
                            }
                        }
                        // Try parsed JSON list from x-data first (these are client-side novels)
                        if (xDataString) {
                            otherNovels = this.parseNovelsFromSource(xDataString);
                        }
                        domNovels = [];
                        $('ul.grid li').each(function (i, el) {
                            var name = $(el).find('h3').text().trim();
                            var cover = $(el).find('img').attr('src');
                            var path = $(el).find('picture a').attr('href');
                            if (name && path) {
                                domNovels.push({
                                    name: name,
                                    cover: cover || defaultCover_1.defaultCover,
                                    path: path.replace(/^\//, ''),
                                });
                            }
                        });
                        // If caller wants Latest/Recientes, return the grid (DOM + x-data merged),
                        // otherwise (Popular) return only the carousel items parsed earlier.
                        if (showLatestNovels) {
                            // Include both server-rendered DOM novels and client-side x-data novels.
                            // Use `addNovel` (with `seen`) to avoid duplicates and prevent parsing
                            // the same novel twice.
                            domNovels.forEach(addNovel);
                            otherNovels.forEach(addNovel);
                            return [2 /*return*/, novels];
                        }
                        // showLatestNovels === false -> Popular: do not add grid items, return carousel only
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    PanchoPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var html, $, novel, genres, statusText, blocks, chapterMap;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + novelPath).then(function (res) { return res.text(); })];
                    case 1:
                        html = _a.sent();
                        $ = (0, cheerio_1.load)(html);
                        novel = {
                            path: novelPath,
                            name: $('h1').text().trim(),
                        };
                        novel.cover =
                            $('img.aspect-\\[2\\/3\\]').attr('src') ||
                                $('img').first().attr('src') ||
                                defaultCover_1.defaultCover;
                        novel.summary = $('div[x-ref="novelDescription"]').text().trim();
                        genres = [];
                        $('ul.flex.flex-wrap li').each(function (i, el) {
                            genres.push($(el).text().trim());
                        });
                        novel.genres = genres.join(', ');
                        novel.author = $('a[href^="/translator/"]').text().trim() || 'Pancho';
                        statusText = $('span:contains("Novela")').text();
                        if (statusText.includes('Activa')) {
                            novel.status = novelStatus_1.NovelStatus.Ongoing;
                        }
                        else if (statusText.includes('Finalizada')) {
                            novel.status = novelStatus_1.NovelStatus.Completed;
                        }
                        else {
                            novel.status = novelStatus_1.NovelStatus.Unknown;
                        }
                        blocks = $('[x-data]').toArray();
                        chapterMap = new Map();
                        blocks.forEach(function (el) {
                            var xdata = $(el).attr('x-data') || '';
                            if (!xdata.includes('chapters:'))
                                return;
                            var m = xdata.match(/chapters\s*:\s*(\[[\s\S]*?\])\s*,\s*visibleChapters/);
                            if (!m)
                                return;
                            try {
                                var jsonStr = m[1]
                                    .replace(/\s+/g, ' ')
                                    .replace(/([{,])\s*([a-zA-Z_$][\w$]*)\s*:/g, '$1"$2":')
                                    .replace(/'/g, '"');
                                var chaptersData = JSON.parse(jsonStr);
                                var novelSlug_1 = novelPath.split('/').filter(Boolean).pop() || '';
                                chaptersData.forEach(function (ch, index) {
                                    if (!ch.chapterSlug || !ch.chapterName)
                                        return;
                                    var path = "novel/".concat(novelSlug_1, "/").concat(ch.chapterSlug);
                                    if (!chapterMap.has(path)) {
                                        chapterMap.set(path, {
                                            name: ch.chapterName,
                                            path: path,
                                            releaseTime: ch.chapterDate,
                                            chapterNumber: ch.chapterNumber, // If available in source, else could infer
                                        });
                                    }
                                });
                            }
                            catch (e) {
                                // Ignore parsing errors for individual blocks
                            }
                        });
                        novel.chapters = Array.from(chapterMap.values());
                        // Assume source arrays are Newest->Oldest, so reversing gives Oldest->Newest
                        novel.chapters.reverse();
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    PanchoPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var $, chapterText;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCheerio(this.site + chapterPath)];
                    case 1:
                        $ = _a.sent();
                        chapterText = $('p.mb-2').parent().first().html() || '';
                        return [2 /*return*/, chapterText];
                }
            });
        });
    };
    PanchoPlugin.prototype.searchNovels = function (searchTerm) {
        return __awaiter(this, void 0, void 0, function () {
            var $, novels;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCheerio(this.site + 'novel/search?q=' + encodeURIComponent(searchTerm))];
                    case 1:
                        $ = _a.sent();
                        novels = [];
                        $('div.mx-px, div.mx-1').each(function (i, el) {
                            var name = $(el).find('span.text-white').first().text().trim();
                            var cover = $(el).find('img').attr('src');
                            var path = $(el).find('a[href^="/novel/"]').attr('href');
                            if (name && path) {
                                novels.push({
                                    name: name,
                                    cover: cover || defaultCover_1.defaultCover,
                                    path: path.replace(/^\//, ''),
                                });
                            }
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    return PanchoPlugin;
}());
var plugin = new PanchoPlugin();
exports.default = plugin;
