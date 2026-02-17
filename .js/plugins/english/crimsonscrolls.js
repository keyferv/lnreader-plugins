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
var cheerio_1 = require("cheerio");
var fetch_1 = require("@libs/fetch");
var storage_1 = require("@libs/storage");
var APIAction;
(function (APIAction) {
    APIAction["novels"] = "load_novels";
    APIAction["search"] = "live_novel_search";
})(APIAction || (APIAction = {}));
var CrimsonScrollsPlugin = /** @class */ (function () {
    function CrimsonScrollsPlugin() {
        var _this = this;
        this.id = 'crimsonscrolls';
        this.name = 'Crimson Scrolls';
        this.icon = 'src/en/crimsonscrolls/icon.png';
        this.site = 'https://crimsonscrolls.net';
        this.version = '1.0.0';
        this.hideLocked = storage_1.storage.get('hideLocked');
        this.pluginSettings = {
            hideLocked: {
                value: '',
                label: 'Hide locked chapters',
                type: 'Switch',
            },
        };
        this.resolveUrl = function (path, isNovel) {
            return _this.site + '/novel/' + path;
        };
    }
    CrimsonScrollsPlugin.prototype.queryAPI = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var formData, _i, _a, _b, key, value, result;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        formData = new FormData();
                        formData.append('action', query.action);
                        for (_i = 0, _a = Object.entries(query.params); _i < _a.length; _i++) {
                            _b = _a[_i], key = _b[0], value = _b[1];
                            formData.append(key, value.toString());
                        }
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.site, "/wp-admin/admin-ajax.php"), {
                                method: 'POST',
                                body: formData,
                            }).then(function (result) { return result.json(); })];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, (0, cheerio_1.load)(result.html)];
                }
            });
        });
    };
    CrimsonScrollsPlugin.prototype.fetchChapters = function (id, page) {
        return __awaiter(this, void 0, void 0, function () {
            var chapter, url, data, locked, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        chapter = [];
                        url = "".concat(this.site, "/wp-json/cs/v1/novels/").concat(id, "/chapters?per_page=75?order=asc");
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(url, "&page=").concat(page || 1)).then(function (r) { return r.json(); })];
                    case 1:
                        data = _c.sent();
                        locked = data.items.some(function (e) { return e.locked; });
                        if (!(data.page < data.total_pages && !(locked && this.hideLocked))) return [3 /*break*/, 3];
                        _b = (_a = data.items).concat;
                        return [4 /*yield*/, this.fetchChapters(id, parseInt(data.page) + 1)];
                    case 2: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
                    case 3: return [2 /*return*/, data.items];
                }
            });
        });
    };
    CrimsonScrollsPlugin.prototype.parseNovels = function (loadedCheerio) {
        var _this = this;
        var novels = [];
        loadedCheerio(':is(a.live-search-item, div.novel-list-card)').each(function (i, el) {
            var novelName = loadedCheerio(el)
                .find(':is(div.live-search-title, h3.novel-title)')
                .text()
                .trim();
            var novelCover = loadedCheerio(el)
                .find(':is(img.live-search-cover, div.novel-cover img)')
                .attr('src');
            var novelUrl = loadedCheerio(el).find('a').attr('href') ||
                loadedCheerio(el).attr('href');
            if (!novelUrl)
                return;
            var novel = {
                name: novelName
                    .trim()
                    .split(' ')
                    .filter(function (e) { return e.length > 0; })
                    .join(' '),
                cover: novelCover,
                path: novelUrl.replace(_this.site, '').split('/')[2],
            };
            novels.push(novel);
        });
        return novels;
    };
    CrimsonScrollsPlugin.prototype.popularNovels = function (page) {
        return __awaiter(this, void 0, void 0, function () {
            var loadedCheerio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.queryAPI({
                            action: APIAction.novels,
                            params: { page: page.toString() },
                        })];
                    case 1:
                        loadedCheerio = _a.sent();
                        return [2 /*return*/, this.parseNovels(loadedCheerio)];
                }
            });
        });
    };
    CrimsonScrollsPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var result, loadedCheerio, novelInfo, novel, id, chapters, idx;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.site, "/novel/").concat(novelPath)).then(function (r) {
                            return r.text();
                        })];
                    case 1:
                        result = _e.sent();
                        loadedCheerio = (0, cheerio_1.load)(result);
                        novelInfo = loadedCheerio('#single-novel-content-wrapper');
                        novel = {
                            path: novelPath,
                            name: novelInfo.find('h1.chapter-title').text().trim() || 'Untitled',
                            cover: novelInfo.find('.single-novel-cover > img').data('src'),
                            summary: novelInfo.find('#synopsis-full').text().trim(),
                            author: (_b = (_a = novelInfo
                                .find('.single-novel-meta strong')
                                .filter(function (i, el) {
                                return loadedCheerio(el).text().toLowerCase().search('author') >= 0;
                            })[0].next) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.trim(),
                            chapters: [],
                        };
                        novel.genres = (_d = (_c = novelInfo
                            .find('.single-novel-meta strong')
                            .filter(function (i, el) {
                            return loadedCheerio(el).text().toLowerCase().search('genre') >= 0;
                        })[0].next) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.split(',').map(function (e) { return e.trim(); }).join(',');
                        novel.status = 'Unknown';
                        id = loadedCheerio('#chapter-list').data('novel');
                        return [4 /*yield*/, this.fetchChapters(id)];
                    case 2:
                        chapters = _e.sent();
                        novel.chapters = [];
                        for (idx in chapters) {
                            if (!(chapters[idx].locked && this.hideLocked)) {
                                novel.chapters.push({
                                    name: chapters[idx].locked
                                        ? "\uD83D\uDD12 ".concat(chapters[idx].title)
                                        : chapters[idx].title,
                                    path: chapters[idx].url.replace(this.site, '').split('/')[2],
                                    chapterNumber: parseInt(idx) + 1,
                                });
                            }
                        }
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    CrimsonScrollsPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var body, loadedCheerio, _i, _a, i, chapterText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.site, "/chapter/").concat(chapterPath)).then(function (r) {
                            return r.text();
                        })];
                    case 1:
                        body = _b.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        for (_i = 0, _a = [
                            'hr.cs-attrib-divider',
                            'div.cs-attrib',
                            'p.cs-chapter-attrib',
                        ]; _i < _a.length; _i++) {
                            i = _a[_i];
                            loadedCheerio("#chapter-display ".concat(i, ":last")).remove();
                        }
                        chapterText = loadedCheerio('#chapter-display').html() || '';
                        return [2 /*return*/, chapterText];
                }
            });
        });
    };
    CrimsonScrollsPlugin.prototype.searchNovels = function (searchTerm) {
        return __awaiter(this, void 0, void 0, function () {
            var loadedCheerio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.queryAPI({
                            action: APIAction.search,
                            params: { query: searchTerm },
                        })];
                    case 1:
                        loadedCheerio = _a.sent();
                        return [2 /*return*/, this.parseNovels(loadedCheerio)];
                }
            });
        });
    };
    return CrimsonScrollsPlugin;
}());
exports.default = new CrimsonScrollsPlugin();
