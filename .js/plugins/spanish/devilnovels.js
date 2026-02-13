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
var defaultCover_1 = require("@libs/defaultCover");
var fetch_1 = require("@libs/fetch");
var sleep = function (ms) { return new Promise(function (res) { return setTimeout(res, ms); }); };
var DevilNovels = /** @class */ (function () {
    function DevilNovels() {
        this.id = 'DevilNovels';
        this.name = 'DevilNovels';
        this.icon = 'src/es/devilnovels/icon.png';
        this.site = 'https://devilnovels.com/';
        this.version = '1.0.3';
        this.filters = {};
    }
    DevilNovels.prototype.popularNovels = function (page_1, _a) {
        return __awaiter(this, arguments, void 0, function (page, _b) {
            var novels, url, res, body, $, map, all, perPage, pageNo, start, end, batch;
            var _this = this;
            var showLatestNovels = _b.showLatestNovels, filters = _b.filters;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        novels = [];
                        url = this.site + 'listado-de-novelas/';
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        res = _c.sent();
                        if (!res.ok)
                            return [2 /*return*/, novels];
                        return [4 /*yield*/, res.text()];
                    case 2:
                        body = _c.sent();
                        $ = (0, cheerio_1.load)(body);
                        map = new Map();
                        // 1) Featured grid items
                        $('.pvc-featured-pages-grid .pvc-featured-page-item').each(function (i, el) {
                            var item = $(el);
                            var a = item.find('a').first();
                            var href = a.attr('href') || '';
                            var img = item.find('img').attr('src') || defaultCover_1.defaultCover;
                            var title = item.find('p.pvc-page-title a').text().trim() ||
                                a.attr('title') ||
                                a.text().trim();
                            var path = href.replace(_this.site, '');
                            if (title)
                                map.set(path || href, { name: title, path: path, cover: img });
                        });
                        // 2) Any standalone titles (p.pvc-page-title a)
                        $('p.pvc-page-title a').each(function (i, el) {
                            var a = $(el);
                            var href = a.attr('href') || '';
                            var title = a.text().trim();
                            var parent = a.closest('.pvc-featured-page-item');
                            var img = parent && parent.length
                                ? parent.find('img').attr('src') || defaultCover_1.defaultCover
                                : defaultCover_1.defaultCover;
                            var path = href.replace(_this.site, '');
                            if (title)
                                map.set(path || href, { name: title, path: path, cover: img });
                        });
                        // 3) Fallback: parse table rows (some pages show a table of updates)
                        $('table tbody tr').each(function (i, el) {
                            var tds = $(el).find('td');
                            if (tds.length < 1)
                                return;
                            var left = tds.first();
                            var right = tds.eq(1);
                            var titleA = left.find('a').first();
                            var href = titleA.attr('href') || '';
                            var name = titleA.text().trim();
                            var img = left.find('img').attr('src') || defaultCover_1.defaultCover;
                            var path = href.replace(_this.site, '');
                            // Try to capture the latest chapter from the second <td>
                            var latestChapter;
                            if (right && right.length) {
                                var latestA = right.find('a').first();
                                var lhref = latestA.attr('href') || '';
                                var lname = latestA.text().trim();
                                if (lname) {
                                    latestChapter = { name: lname, path: lhref.replace(_this.site, '') };
                                }
                            }
                            if (name)
                                map.set(path || href, { name: name, path: path, cover: img, latestChapter: latestChapter });
                        });
                        all = Array.from(map.values());
                        perPage = 10;
                        pageNo = Math.max(1, page || 1);
                        start = (pageNo - 1) * perPage;
                        end = start + perPage;
                        batch = all.slice(start, end);
                        // Slight pause to avoid hammering the site when iterating pages
                        return [4 /*yield*/, sleep(600)];
                    case 3:
                        // Slight pause to avoid hammering the site when iterating pages
                        _c.sent();
                        return [2 /*return*/, batch];
                }
            });
        });
    };
    DevilNovels.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, res, body, $, novel, entry, clone, cleanedText, firstP, seen, pageLinks, uniquePageLinks, _loop_1, this_1, _i, uniquePageLinks_1, pageUrl;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = novelPath.startsWith('http')
                            ? novelPath
                            : this.site + novelPath;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.text()];
                    case 2:
                        body = _a.sent();
                        $ = (0, cheerio_1.load)(body);
                        novel = {
                            path: novelPath,
                            name: $('meta[property="og:title"]').attr('content') ||
                                $('h1').first().text().trim() ||
                                '',
                            cover: $('meta[property="og:image"]').attr('content') || defaultCover_1.defaultCover,
                            summary: undefined,
                            chapters: [],
                        };
                        entry = $('.entry-content').first();
                        if (entry && entry.length) {
                            clone = entry.clone();
                            // Remove blocks that should not be part of the summary
                            clone
                                .find('.elementor-posts-container, .elementor-posts, .elementor-post, .elementor-pagination, .code-block, iframe, script, style, .ad, .adsbygoogle, .post-list, .chapter-list, [data-id="c7ecb4a"], .elementor-element-c7ecb4a')
                                .remove();
                            // Also remove common ad containers or shortcodes
                            clone.find('[class*="ad-"]').remove();
                            cleanedText = clone.text().trim();
                            if (cleanedText) {
                                novel.summary = cleanedText;
                            }
                            else {
                                firstP = entry
                                    .find('p')
                                    .filter(function (i, el) { return $(el).text().trim(); })
                                    .first();
                                if (firstP && firstP.length)
                                    novel.summary = firstP.text().trim();
                            }
                        }
                        seen = new Set();
                        $('.entry-content a, .post a').each(function (i, el) {
                            var a = $(el);
                            var href = a.attr('href') || '';
                            var text = a.text().trim();
                            if (!href || !text)
                                return;
                            // basic heuristic: chapter links often contain 'chapter' or 'capitulo' or '/act/'
                            if (/chapter|capitulo|cap|act/i.test(href)) {
                                var path = href.replace(_this.site, '');
                                if (!seen.has(path)) {
                                    seen.add(path);
                                    novel.chapters.push({ name: text, path: path });
                                }
                            }
                        });
                        // Some themes (Elementor) list posts/articles as chapter links inside
                        // an elementor-posts grid — handle those too (h3.elementor-post__title a)
                        $('.elementor-posts-container article, .elementor-post').each(function (i, el) {
                            var block = $(el);
                            var a = block
                                .find('h3.elementor-post__title a, h3.elementor-post__title > a, a[data-wpel-link="internal"]')
                                .first();
                            var href = a.attr('href') || '';
                            var text = a.text().trim();
                            if (!href || !text)
                                return;
                            var path = href.replace(_this.site, '');
                            if (!seen.has(path)) {
                                seen.add(path);
                                novel.chapters.push({ name: text, path: path });
                            }
                        });
                        pageLinks = $('.elementor-pagination a.page-numbers')
                            .map(function (i, el) { return $(el).attr('href') || ''; })
                            .get()
                            .filter(function (h) { return !!h; });
                        uniquePageLinks = Array.from(new Set(pageLinks));
                        _loop_1 = function (pageUrl) {
                            var normalizedPageUrl, abs, pres, pbody, $$_1, e_1;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        normalizedPageUrl = pageUrl.replace(/#.*$/, '');
                                        if (!normalizedPageUrl)
                                            return [2 /*return*/, "continue"];
                                        // Avoid refetching the main novel URL
                                        if (normalizedPageUrl === url ||
                                            normalizedPageUrl === this_1.site + novelPath)
                                            return [2 /*return*/, "continue"];
                                        _b.label = 1;
                                    case 1:
                                        _b.trys.push([1, 5, , 6]);
                                        abs = normalizedPageUrl.startsWith('http')
                                            ? normalizedPageUrl
                                            : this_1.site + normalizedPageUrl.replace(/^\//, '');
                                        return [4 /*yield*/, (0, fetch_1.fetchApi)(abs)];
                                    case 2:
                                        pres = _b.sent();
                                        if (!pres.ok)
                                            return [2 /*return*/, "continue"];
                                        return [4 /*yield*/, pres.text()];
                                    case 3:
                                        pbody = _b.sent();
                                        $$_1 = (0, cheerio_1.load)(pbody);
                                        // extract chapter links from this page (same selectors)
                                        $$_1('.elementor-posts-container article, .elementor-post').each(function (i, el) {
                                            var block = $$_1(el);
                                            var a = block
                                                .find('h3.elementor-post__title a, h3.elementor-post__title > a, a[data-wpel-link="internal"]')
                                                .first();
                                            var href = a.attr('href') || '';
                                            var text = a.text().trim();
                                            if (!href || !text)
                                                return;
                                            var path = href.replace(_this.site, '');
                                            if (!seen.has(path)) {
                                                seen.add(path);
                                                novel.chapters.push({ name: text, path: path });
                                            }
                                        });
                                        // small pause between page fetches
                                        return [4 /*yield*/, sleep(300)];
                                    case 4:
                                        // small pause between page fetches
                                        _b.sent();
                                        return [3 /*break*/, 6];
                                    case 5:
                                        e_1 = _b.sent();
                                        return [2 /*return*/, "continue"];
                                    case 6: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, uniquePageLinks_1 = uniquePageLinks;
                        _a.label = 3;
                    case 3:
                        if (!(_i < uniquePageLinks_1.length)) return [3 /*break*/, 6];
                        pageUrl = uniquePageLinks_1[_i];
                        return [5 /*yield**/, _loop_1(pageUrl)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [2 /*return*/, novel];
                }
            });
        });
    };
    DevilNovels.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, res, body, $, content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = chapterPath.startsWith('http')
                            ? chapterPath
                            : this.site + chapterPath;
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.text()];
                    case 2:
                        body = _a.sent();
                        $ = (0, cheerio_1.load)(body);
                        content = $('.entry-content').first().html() || $('article').first().html() || '';
                        return [2 /*return*/, content];
                }
            });
        });
    };
    DevilNovels.prototype.searchNovels = function (searchTerm, page) {
        return __awaiter(this, void 0, void 0, function () {
            var novels, pageQuery, url, res, body, $;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        novels = [];
                        pageQuery = page && page > 1 ? "&paged=".concat(page) : '';
                        url = "".concat(this.site, "?post_type=page&s=").concat(encodeURIComponent(searchTerm)).concat(pageQuery);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            return [2 /*return*/, novels];
                        return [4 /*yield*/, res.text()];
                    case 2:
                        body = _a.sent();
                        $ = (0, cheerio_1.load)(body);
                        // Each result is rendered as an article block with class 'ast-article-inner'
                        $('.ast-article-inner').each(function (i, el) {
                            var block = $(el);
                            var a = block.find('h2.entry-title a').first();
                            var href = a.attr('href') || '';
                            var title = a.text().trim();
                            var img = block.find('.post-thumb img').attr('src') || defaultCover_1.defaultCover;
                            var path = href.replace(_this.site, '');
                            if (title)
                                novels.push({ name: title, path: path, cover: img });
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    return DevilNovels;
}());
exports.default = new DevilNovels();
