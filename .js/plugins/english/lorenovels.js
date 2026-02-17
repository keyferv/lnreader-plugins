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
var LoreNovels = /** @class */ (function () {
    function LoreNovels() {
        this.id = 'lorenovels';
        this.name = 'Lore Novels';
        this.icon = 'src/en/lorenovels/icon.png';
        this.site = 'https://lorenovels.com';
        this.version = '1.0.3';
    }
    LoreNovels.prototype.resolvePath = function (href) {
        if (!href)
            return undefined;
        if (href.startsWith('http')) {
            var url = new URL(href);
            if (!url.hostname.endsWith('lorenovels.com'))
                return undefined;
            return url.pathname;
        }
        if (!href.startsWith('/'))
            return "/".concat(href);
        return href;
    };
    LoreNovels.prototype.resolveCover = function (src) {
        if (!src || src.startsWith('data:'))
            return undefined;
        if (src.startsWith('http'))
            return src;
        return new URL(src, this.site).toString();
    };
    LoreNovels.prototype.parseHomeNovels = function (loadedCheerio) {
        var _this = this;
        var container = loadedCheerio('div.entry-content.alignwide.wp-block-post-content').first();
        var root = (container.length ? container : loadedCheerio.root());
        var novels = [];
        var seen = new Set();
        root.find('div.wp-block-column').each(function (_, el) {
            var column = loadedCheerio(el);
            var link = column.find('h2 a').first().attr('href');
            var name = column.find('h2 a').first().text().trim();
            var img = column.find('figure img').first();
            var cover = _this.resolveCover(img.attr('data-src') || img.attr('src'));
            var path = _this.resolvePath(link);
            if (!name || !path || seen.has(path))
                return;
            seen.add(path);
            novels.push({
                name: name,
                path: path,
                cover: cover,
            });
        });
        return novels;
    };
    LoreNovels.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var body, loadedCheerio;
            var showLatestNovels = _b.showLatestNovels;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (pageNo > 1)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site).then(function (res) { return res.text(); })];
                    case 1:
                        body = _c.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        if (showLatestNovels) {
                            return [2 /*return*/, this.parseHomeNovels(loadedCheerio)];
                        }
                        return [2 /*return*/, this.parseHomeNovels(loadedCheerio)];
                }
            });
        });
    };
    LoreNovels.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var body, loadedCheerio, name, contentImg, wpImg, postImg, blockImg, figImg, firstImg, cover, metaLabels, author, genres, status, artist, summaryParts, summary, chapters, seen;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + novelPath).then(function (res) { return res.text(); })];
                    case 1:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        name = loadedCheerio('h1.entry-title, h1.wp-block-post-title, h1')
                            .first()
                            .text()
                            .trim();
                        contentImg = loadedCheerio('div.entry-content figure.wp-block-image img').first();
                        wpImg = loadedCheerio('div.entry-content img[class*="wp-image-"]').first();
                        postImg = loadedCheerio('img.wp-post-image').first();
                        blockImg = loadedCheerio('.wp-block-image img').first();
                        figImg = loadedCheerio('figure img').first();
                        firstImg = loadedCheerio('div.entry-content img').first();
                        cover = this.resolveCover(contentImg.attr('data-src') ||
                            contentImg.attr('src') ||
                            wpImg.attr('data-src') ||
                            wpImg.attr('src') ||
                            postImg.attr('data-src') ||
                            postImg.attr('src') ||
                            blockImg.attr('data-src') ||
                            blockImg.attr('src') ||
                            figImg.attr('data-src') ||
                            figImg.attr('src') ||
                            firstImg.attr('data-src') ||
                            firstImg.attr('src'));
                        metaLabels = [
                            'title:',
                            'author:',
                            'genre:',
                            'genres:',
                            'status:',
                            'artist:',
                        ];
                        loadedCheerio('div.wp-block-group.is-vertical').each(function (_, el) {
                            var group = loadedCheerio(el);
                            var label = group.find('p').first().text().trim().toLowerCase();
                            if (!metaLabels.includes(label))
                                return;
                            var value = group.find('h2').first().text().trim() ||
                                group.find('.wp-block-button__link').first().text().trim();
                            if (!value)
                                return;
                            if (label === 'title:') {
                                if (!name || name === 'Untitled') {
                                    name = value;
                                }
                            }
                            else if (label === 'author:')
                                author = value;
                            else if (label === 'genre:' || label === 'genres:')
                                genres = value;
                            else if (label === 'status:')
                                status = value;
                            else if (label === 'artist:')
                                artist = value;
                        });
                        summaryParts = [];
                        loadedCheerio('div.entry-content p').each(function (_, el) {
                            var text = loadedCheerio(el).text().trim();
                            if (!text)
                                return;
                            if (metaLabels.includes(text.toLowerCase()))
                                return;
                            summaryParts.push(text);
                        });
                        summary = summaryParts.join('\n\n') || undefined;
                        chapters = [];
                        seen = new Set();
                        // Latest posts block (primary chapter list)
                        loadedCheerio('.wp-block-latest-posts__post-title').each(function (_, el) {
                            var anchor = loadedCheerio(el);
                            var href = anchor.attr('href');
                            var path = _this.resolvePath(href);
                            var title = anchor.text().trim();
                            if (!path || !title || seen.has(path))
                                return;
                            seen.add(path);
                            chapters.push({ name: title, path: path });
                        });
                        // Fallback: entry-content links
                        loadedCheerio('div.entry-content a:not(.wp-block-button__link)').each(function (_, el) {
                            var anchor = loadedCheerio(el);
                            var href = anchor.attr('href');
                            var path = _this.resolvePath(href);
                            var title = anchor.text().trim();
                            if (!path || !title)
                                return;
                            if (path.includes('#') || path.includes('/wp-content/'))
                                return;
                            if (!/chapter|cap|ch\.?\s?\d/i.test(title) && !/chapter/i.test(path)) {
                                return;
                            }
                            if (seen.has(path))
                                return;
                            seen.add(path);
                            chapters.push({
                                name: title,
                                path: path,
                            });
                        });
                        return [2 /*return*/, {
                                path: novelPath,
                                name: name || 'Untitled',
                                cover: cover,
                                summary: summary,
                                author: author,
                                artist: artist,
                                genres: genres,
                                status: status,
                                chapters: chapters,
                            }];
                }
            });
        });
    };
    LoreNovels.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var body, loadedCheerio, title, content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + chapterPath).then(function (res) {
                            return res.text();
                        })];
                    case 1:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        title = loadedCheerio('h1.wp-block-post-title').text().trim();
                        loadedCheerio('script, style, .sharedaddy, .wp-block-buttons, nav, form, .comment-respond, .not-a-member-block, .site-comments, .wp-block-post-navigation-link').remove();
                        loadedCheerio('div.entry-content img').each(function (_, el) {
                            var img = loadedCheerio(el);
                            var dataSrc = img.attr('data-src');
                            if (dataSrc) {
                                img.attr('src', dataSrc);
                                img.removeAttr('data-src');
                            }
                        });
                        content = loadedCheerio('div.entry-content').html() || '';
                        return [2 /*return*/, "<h1>".concat(title, "</h1>\n").concat(content)];
                }
            });
        });
    };
    LoreNovels.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, body, loadedCheerio, novels, seen;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (pageNo > 1)
                            return [2 /*return*/, []];
                        url = "".concat(this.site, "/?s=").concat(encodeURIComponent(searchTerm));
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (res) { return res.text(); })];
                    case 1:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        novels = [];
                        seen = new Set();
                        loadedCheerio('article').each(function (_, el) {
                            var article = loadedCheerio(el);
                            var link = article.find('h2 a, h1 a').first().attr('href');
                            var name = article.find('h2, h1').first().text().trim();
                            var searchImg = article.find('img').first();
                            var cover = _this.resolveCover(searchImg.attr('data-src') || searchImg.attr('src'));
                            var path = _this.resolvePath(link);
                            if (!name || !path || seen.has(path))
                                return;
                            if (/chapter|cap|ch\.?\s?\d/i.test(name))
                                return;
                            seen.add(path);
                            novels.push({
                                name: name,
                                path: path,
                                cover: cover,
                            });
                        });
                        if (novels.length)
                            return [2 /*return*/, novels];
                        return [2 /*return*/, this.parseHomeNovels(loadedCheerio)];
                }
            });
        });
    };
    return LoreNovels;
}());
exports.default = new LoreNovels();
