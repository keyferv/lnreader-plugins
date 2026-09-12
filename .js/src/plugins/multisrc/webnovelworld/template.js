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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebNovelWorld = void 0;
var cheerio_1 = require("cheerio");
var fetch_1 = require("@libs/fetch");
var dayjs_1 = __importDefault(require("dayjs"));
var WebNovelWorld = /** @class */ (function () {
    function WebNovelWorld(metadata) {
        var _a;
        this.headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        };
        this.imageRequestInit = {
            headers: this.headers,
        };
        this.id = metadata.id;
        this.name = metadata.sourceName;
        this.icon = "multisrc/webnovelworld/".concat(metadata.id.toLowerCase(), "/icon.png");
        this.site = metadata.sourceSite;
        var versionIncrements = ((_a = metadata.options) === null || _a === void 0 ? void 0 : _a.versionIncrements) || 0;
        this.version = "1.0.".concat(2 + versionIncrements);
        this.options = metadata.options;
        this.filters = metadata.filters;
    }
    WebNovelWorld.prototype.popularNovels = function (page_1, _a) {
        return __awaiter(this, arguments, void 0, function (page, _b) {
            var link, body, loadedCheerio, novels;
            var _c, _d, _e;
            var filters = _b.filters;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        link = "".concat(this.site, "browse/");
                        link += "".concat(((_c = filters === null || filters === void 0 ? void 0 : filters.genres) === null || _c === void 0 ? void 0 : _c.value) || 'all', "/");
                        link += "".concat(((_d = filters === null || filters === void 0 ? void 0 : filters.order) === null || _d === void 0 ? void 0 : _d.value) || 'popular', "/");
                        link += "".concat(((_e = filters === null || filters === void 0 ? void 0 : filters.status) === null || _e === void 0 ? void 0 : _e.value) || 'all', "/");
                        link += page;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(link).then(function (r) { return r.text(); })];
                    case 1:
                        body = _f.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        novels = [];
                        loadedCheerio('.novel-item.ads').remove();
                        loadedCheerio('.novel-item').each(function (idx, ele) {
                            var _a;
                            var novelName = loadedCheerio(ele).find('.novel-title').text().trim();
                            var novelCover = loadedCheerio(ele).find('img').attr('data-src');
                            var novelUrl = (_a = loadedCheerio(ele)
                                .find('.novel-title > a')
                                .attr('href')) === null || _a === void 0 ? void 0 : _a.substring(1);
                            if (!novelUrl)
                                return;
                            var novel = {
                                name: novelName,
                                cover: novelCover,
                                path: novelUrl,
                            };
                            novels.push(novel);
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    WebNovelWorld.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var body, loadedCheerio, totalChapters, novel;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + novelPath).then(function (r) {
                            return r.text();
                        })];
                    case 1:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        totalChapters = parseInt(loadedCheerio('.header-stats span:first strong').text(), 10);
                        novel = {
                            path: novelPath,
                            name: loadedCheerio('h1.novel-title').text().trim() || 'Untitled',
                            cover: loadedCheerio('figure.cover > img').attr('data-src'),
                            author: loadedCheerio('.author > a > span').text(),
                            summary: loadedCheerio('.summary > .content').text().trim(),
                            status: loadedCheerio('.header-stats span:last strong').text(),
                            totalPages: Math.ceil(totalChapters / 100),
                            chapters: [],
                        };
                        novel.genres = loadedCheerio('.categories ul li')
                            .map(function (a, ex) { return loadedCheerio(ex).text().trim(); })
                            .toArray()
                            .join(',');
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    WebNovelWorld.prototype.parsePage = function (novelPath, page) {
        return __awaiter(this, void 0, void 0, function () {
            var url, body, loadedCheerio, chapter, chapters;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.site + novelPath + '/chapters/page-' + page;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (res) { return res.text(); })];
                    case 1:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        chapter = [];
                        loadedCheerio('.chapter-list li').each(function () {
                            var _a;
                            var chapterName = 'Chapter ' +
                                loadedCheerio(this).find('.chapter-no').text().trim() +
                                ' - ' +
                                loadedCheerio(this).find('.chapter-title').text().trim();
                            var releaseDate = loadedCheerio(this)
                                .find('.chapter-update')
                                .attr('datetime');
                            var chapterUrl = (_a = loadedCheerio(this)
                                .find('a')
                                .attr('href')) === null || _a === void 0 ? void 0 : _a.substring(1);
                            if (!chapterUrl)
                                return;
                            chapter.push({
                                name: chapterName,
                                path: chapterUrl,
                                releaseTime: (0, dayjs_1.default)(releaseDate).toISOString(),
                            });
                        });
                        chapters = chapter;
                        return [2 /*return*/, { chapters: chapters }];
                }
            });
        });
    };
    WebNovelWorld.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var body, loadedCheerio, chapterText;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + chapterPath).then(function (r) {
                            return r.text();
                        })];
                    case 1:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        chapterText = loadedCheerio('#chapter-container').html() || '';
                        return [2 /*return*/, chapterText];
                }
            });
        });
    };
    WebNovelWorld.prototype.searchNovels = function (searchTerm) {
        return __awaiter(this, void 0, void 0, function () {
            var url, link, response, token, verifytoken, formData, results, novels, loadedCheerio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.site, "lnsearchlive");
                        link = "".concat(this.site, "search");
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(link).then(function (r) { return r.text(); })];
                    case 1:
                        response = _a.sent();
                        token = (0, cheerio_1.load)(response);
                        verifytoken = token('#novelSearchForm > input').attr('value');
                        formData = new FormData();
                        formData.append('inputContent', searchTerm);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url, {
                                method: 'POST',
                                headers: { LNRequestVerifyToken: verifytoken },
                                body: formData,
                            }).then(function (r) { return r.json(); })];
                    case 2:
                        results = _a.sent();
                        novels = [];
                        loadedCheerio = (0, cheerio_1.load)(results.resultview);
                        loadedCheerio('.novel-item').each(function (idx, ele) {
                            var _a;
                            var novelName = loadedCheerio(ele).find('h4.novel-title').text().trim();
                            var novelCover = loadedCheerio(ele).find('img').attr('src');
                            var novelUrl = (_a = loadedCheerio(ele).find('a').attr('href')) === null || _a === void 0 ? void 0 : _a.substring(1);
                            if (!novelUrl)
                                return;
                            novels.push({
                                name: novelName,
                                path: novelUrl,
                                cover: novelCover,
                            });
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    return WebNovelWorld;
}());
exports.WebNovelWorld = WebNovelWorld;
