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
var filterInputs_1 = require("@libs/filterInputs");
var NovelUpdates = /** @class */ (function () {
    function NovelUpdates() {
        this.id = 'novelupdates';
        this.name = 'Novel Updates';
        this.version = '0.11.0';
        this.icon = 'src/en/novelupdates/icon.png';
        this.customCSS = 'src/en/novelupdates/customCSS.css';
        this.site = 'https://www.novelupdates.com/';
        this.filters = {
            sort: {
                label: 'Sort Results By',
                value: 'popmonth',
                options: [
                    { label: 'Popular (Month)', value: 'popmonth' },
                    { label: 'Popular (All)', value: 'popular' },
                    { label: 'Last Updated', value: 'sdate' },
                    { label: 'Rating', value: 'srate' },
                    { label: 'Rank', value: 'srank' },
                    { label: 'Reviews', value: 'sreview' },
                    { label: 'Chapters', value: 'srel' },
                    { label: 'Title', value: 'abc' },
                    { label: 'Readers', value: 'sread' },
                    { label: 'Frequency', value: 'sfrel' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            order: {
                label: 'Order (Not for Popular)',
                value: 'desc',
                options: [
                    { label: 'Descending', value: 'desc' },
                    { label: 'Ascending', value: 'asc' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            storyStatus: {
                label: 'Story Status (Translation)',
                value: '',
                options: [
                    { label: 'All', value: '' },
                    { label: 'Completed', value: '2' },
                    { label: 'Ongoing', value: '3' },
                    { label: 'Hiatus', value: '4' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            genre_operator: {
                label: 'Genre (And/Or) (Not for Popular)',
                value: 'and',
                options: [
                    { label: 'And', value: 'and' },
                    { label: 'Or', value: 'or' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            genres: {
                label: 'Genres',
                type: filterInputs_1.FilterTypes.ExcludableCheckboxGroup,
                value: {
                    include: [],
                    exclude: [],
                },
                options: [
                    { label: 'Action', value: '8' },
                    { label: 'Adult', value: '280' },
                    { label: 'Adventure', value: '13' },
                    { label: 'Comedy', value: '17' },
                    { label: 'Drama', value: '9' },
                    { label: 'Ecchi', value: '292' },
                    { label: 'Fantasy', value: '5' },
                    { label: 'Gender Bender', value: '168' },
                    { label: 'Harem', value: '3' },
                    { label: 'Historical', value: '330' },
                    { label: 'Horror', value: '343' },
                    { label: 'Josei', value: '324' },
                    { label: 'Martial Arts', value: '14' },
                    { label: 'Mature', value: '4' },
                    { label: 'Mecha', value: '10' },
                    { label: 'Mystery', value: '245' },
                    { label: 'Psychoical', value: '486' },
                    { label: 'Romance', value: '15' },
                    { label: 'School Life', value: '6' },
                    { label: 'Sci-fi', value: '11' },
                    { label: 'Seinen', value: '18' },
                    { label: 'Shoujo', value: '157' },
                    { label: 'Shoujo Ai', value: '851' },
                    { label: 'Shounen', value: '12' },
                    { label: 'Shounen Ai', value: '1692' },
                    { label: 'Slice of Life', value: '7' },
                    { label: 'Smut', value: '281' },
                    { label: 'Sports', value: '1357' },
                    { label: 'Supernatural', value: '16' },
                    { label: 'Tragedy', value: '132' },
                    { label: 'Wuxia', value: '479' },
                    { label: 'Xianxia', value: '480' },
                    { label: 'Xuanhuan', value: '3954' },
                    { label: 'Yaoi', value: '560' },
                    { label: 'Yuri', value: '922' },
                ],
            },
            language: {
                label: 'Language',
                value: [],
                options: [
                    { label: 'Chinese', value: '495' },
                    { label: 'Filipino', value: '9181' },
                    { label: 'Indonesian', value: '9179' },
                    { label: 'Japanese', value: '496' },
                    { label: 'Khmer', value: '18657' },
                    { label: 'Korean', value: '497' },
                    { label: 'Malaysian', value: '9183' },
                    { label: 'Thai', value: '9954' },
                    { label: 'Vietnamese', value: '9177' },
                ],
                type: filterInputs_1.FilterTypes.CheckboxGroup,
            },
            novelType: {
                label: 'Novel Type (Not for Popular)',
                value: [],
                options: [
                    { label: 'Light Novel', value: '2443' },
                    { label: 'Published Novel', value: '26874' },
                    { label: 'Web Novel', value: '2444' },
                ],
                type: filterInputs_1.FilterTypes.CheckboxGroup,
            },
            reading_list_operator: {
                label: 'Reading List (Include/Exclude) (Not for Popular)',
                value: 'include',
                options: [
                    { label: 'Include', value: 'include' },
                    { label: 'Exclude', value: 'exclude' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            reading_lists: {
                label: 'Reading Lists (Not for Popular)',
                value: [],
                options: [{ label: 'All Reading Lists', value: '-1' }],
                type: filterInputs_1.FilterTypes.CheckboxGroup,
            },
        };
    }
    NovelUpdates.prototype.requestHeaders = function () {
        // No User-Agent here: the host client provides it. Only pass the
        // non-UA header this site needs beyond fetchApi's defaults.
        return {
            'Referer': this.site,
        };
    };
    NovelUpdates.prototype.challengeError = function () {
        // No automatic bypass exists in this repo (no WebView->plugin cookie
        // bridge, no allowed Cloudflare-solving library), so surface an
        // actionable error instead of pretending the plugin can solve it.
        return new Error("NovelUpdates is showing a Cloudflare challenge. Open ".concat(this.site, " in the WebView to resolve it; the host must sync its cookies (including cf_clearance) to the plugin client before retrying. The plugin cannot solve CAPTCHAs automatically."));
    };
    NovelUpdates.prototype.isChallengeResponse = function (response, body) {
        var _a, _b;
        var mitigated = ((_b = (_a = response.headers) === null || _a === void 0 ? void 0 : _a.get) === null || _b === void 0 ? void 0 : _b.call(_a, 'cf-mitigated')) || '';
        if (mitigated.toLowerCase().includes('challenge'))
            return true;
        if (response.status === 403 || response.status === 503)
            return true;
        var markers = [
            'Just a moment',
            'Attention Required',
            'attention required',
            'Verifying you are human',
            'cf-challenge',
            'cf-browser-verification',
            'cf_captcha_container',
            'cf_clearance',
            'challenge-platform',
            '__cf_chl',
            'cf-turnstile',
        ];
        return markers.some(function (marker) { return body.includes(marker); });
    };
    NovelUpdates.prototype.fetchDocument = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var response, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(url, {
                            headers: this.requestHeaders(),
                        })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.text().catch(function () { return ''; })];
                    case 2:
                        body = _a.sent();
                        if (this.isChallengeResponse(response, body)) {
                            throw this.challengeError();
                        }
                        if (!response.ok) {
                            throw new Error("Could not reach NovelUpdates (".concat(response.status, "). The site blocks some networks; try again later or open it in WebView once."));
                        }
                        return [2 /*return*/, body];
                }
            });
        });
    };
    NovelUpdates.prototype.pushSeriesLink = function (loadedCheerio, novels, seen, anchor) {
        var el = loadedCheerio(anchor);
        var href = el.attr('href');
        if (!href || !href.includes('/series/'))
            return;
        var path = href.replace(this.site, '').replace(/^\//, '');
        if (!path || seen.has(path))
            return;
        var name = el.closest('.search_main_box_nu').find('.search_title a').text().trim() ||
            el
                .text()
                .trim()
                .replace(/^#\d+\s*/, '');
        if (!name)
            return;
        seen.add(path);
        var container = el.closest('.search_main_box_nu, tr, div');
        var cover = container.find('.search_img_nu img').first().attr('src') ||
            container.find('.search_img_nu img').first().attr('data-src') ||
            container.find('img').first().attr('src') ||
            container.find('img').first().attr('data-src');
        novels.push({ name: name, cover: cover, path: path });
    };
    NovelUpdates.prototype.parseNovels = function (loadedCheerio) {
        var _this = this;
        var novels = [];
        var seen = new Set();
        loadedCheerio('div.search_main_box_nu').each(function (_, el) {
            var novelUrl = loadedCheerio(el).find('.search_title > a').attr('href');
            if (!novelUrl)
                return;
            var path = novelUrl.replace(_this.site, '');
            if (seen.has(path))
                return;
            seen.add(path);
            novels.push({
                name: loadedCheerio(el).find('.search_title > a').text().trim(),
                cover: loadedCheerio(el).find('.search_img_nu img').first().attr('src') ||
                    loadedCheerio(el)
                        .find('.search_img_nu img')
                        .first()
                        .attr('data-src') ||
                    loadedCheerio(el).find('img').first().attr('src') ||
                    loadedCheerio(el).find('img').first().attr('data-src'),
                path: path,
            });
        });
        if (novels.length === 0) {
            loadedCheerio('a[href*="/series/"]').each(function (_, el) {
                _this.pushSeriesLink(loadedCheerio, novels, seen, el);
            });
        }
        return novels;
    };
    NovelUpdates.prototype.parseRanking = function (loadedCheerio) {
        var _this = this;
        var novels = [];
        var seen = new Set();
        var rowSelectors = [
            'div.search_main_box_nu',
            'div.search_main_box',
            '.rank_con',
            '#rank_table tr',
            '.series_rank',
            'tr',
        ];
        for (var _i = 0, rowSelectors_1 = rowSelectors; _i < rowSelectors_1.length; _i++) {
            var selector = rowSelectors_1[_i];
            loadedCheerio(selector).each(function (_, row) {
                loadedCheerio(row)
                    .find('a[href*="/series/"]')
                    .each(function (_, el) {
                    _this.pushSeriesLink(loadedCheerio, novels, seen, el);
                });
            });
            if (novels.length > 0)
                break;
        }
        if (novels.length === 0) {
            loadedCheerio('a[href*="/series/"]').each(function (_, el) {
                _this.pushSeriesLink(loadedCheerio, novels, seen, el);
            });
        }
        return novels;
    };
    NovelUpdates.prototype.popularNovels = function (page_1, _a) {
        return __awaiter(this, arguments, void 0, function (page, _b) {
            var url, isRanking, body, loadedCheerio;
            var _c, _d, _e, _f;
            var showLatestNovels = _b.showLatestNovels, filters = _b.filters;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        url = this.site;
                        isRanking = false;
                        // Build the URL based on filters
                        if (showLatestNovels) {
                            url += 'series-finder/?sf=1&sort=sdate&order=desc';
                        }
                        else if ((filters === null || filters === void 0 ? void 0 : filters.sort.value) === 'popmonth' ||
                            (filters === null || filters === void 0 ? void 0 : filters.sort.value) === 'popular') {
                            url += 'series-ranking/?rank=' + filters.sort.value;
                            isRanking = true;
                        }
                        else {
                            url += 'series-finder/?sf=1';
                            if (((_c = filters === null || filters === void 0 ? void 0 : filters.genres.value.include) === null || _c === void 0 ? void 0 : _c.length) ||
                                ((_d = filters === null || filters === void 0 ? void 0 : filters.genres.value.exclude) === null || _d === void 0 ? void 0 : _d.length)) {
                                url += '&mgi=' + filters.genre_operator.value;
                            }
                            if (filters === null || filters === void 0 ? void 0 : filters.novelType.value.length) {
                                url += '&nt=' + filters.novelType.value.join(',');
                            }
                            if (filters === null || filters === void 0 ? void 0 : filters.reading_lists.value.length) {
                                url += '&hd=' + (filters === null || filters === void 0 ? void 0 : filters.reading_lists.value.join(','));
                                url += '&mRLi=' + (filters === null || filters === void 0 ? void 0 : filters.reading_list_operator.value);
                            }
                            url += '&sort=' + (filters === null || filters === void 0 ? void 0 : filters.sort.value);
                            url += '&order=' + (filters === null || filters === void 0 ? void 0 : filters.order.value);
                        }
                        // Add common filters
                        if (filters === null || filters === void 0 ? void 0 : filters.language.value.length)
                            url += '&org=' + filters.language.value.join(',');
                        if ((_e = filters === null || filters === void 0 ? void 0 : filters.genres.value.include) === null || _e === void 0 ? void 0 : _e.length)
                            url += '&gi=' + filters.genres.value.include.join(',');
                        if ((_f = filters === null || filters === void 0 ? void 0 : filters.genres.value.exclude) === null || _f === void 0 ? void 0 : _f.length)
                            url += '&ge=' + filters.genres.value.exclude.join(',');
                        if (filters === null || filters === void 0 ? void 0 : filters.storyStatus.value)
                            url += '&ss=' + filters.storyStatus.value;
                        url += '&pg=' + page;
                        return [4 /*yield*/, this.fetchDocument(url)];
                    case 1:
                        body = _g.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        return [2 /*return*/, isRanking
                                ? this.parseRanking(loadedCheerio)
                                : this.parseNovels(loadedCheerio)];
                }
            });
        });
    };
    NovelUpdates.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, body, loadedCheerio, textOf, listOf, name, cover, author, artist, genres, statusRaw, status, type, summaryRaw, associatedHtml, altTitles, statsText, statsSources, metaLines, chapterCount, extraCount, volumeCount, unseenAltTitles, summary, summaryWithAltTitles, ratingMatch, rating;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        url = this.site + novelPath;
                        return [4 /*yield*/, this.fetchDocument(url)];
                    case 1:
                        body = _f.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        textOf = function (selector) {
                            return loadedCheerio(selector).first().text().trim();
                        };
                        listOf = function (selector) {
                            return loadedCheerio(selector)
                                .map(function (_, el) { return loadedCheerio(el).text().trim(); })
                                .toArray()
                                .filter(function (name) { return Boolean(name); });
                        };
                        name = textOf('.seriestitlenu') ||
                            ((_a = loadedCheerio('meta[property="og:title"]').attr('content')) === null || _a === void 0 ? void 0 : _a.trim()) ||
                            'Untitled';
                        cover = loadedCheerio('.seriesimg img').first().attr('src') ||
                            loadedCheerio('.seriesimg img').first().attr('data-src') ||
                            loadedCheerio('.wpb_wrapper img').first().attr('src') ||
                            loadedCheerio('meta[property="og:image"]').attr('content');
                        author = listOf('#showauthors a').join(', ') ||
                            listOf('#authtag').join(', ') ||
                            undefined;
                        artist = listOf('#showartists a').join(', ') || undefined;
                        genres = listOf('#seriesgenre a').join(',');
                        statusRaw = loadedCheerio('#editstatus').text().trim();
                        status = 'Unknown';
                        if (/ongoing/i.test(statusRaw))
                            status = 'Ongoing';
                        else if (/hiatus/i.test(statusRaw))
                            status = 'Hiatus';
                        else if (/complet/i.test(statusRaw))
                            status = 'Completed';
                        else if (statusRaw)
                            status = statusRaw;
                        type = textOf('#showtype');
                        summaryRaw = loadedCheerio('#editdescription').text().trim();
                        associatedHtml = (_b = loadedCheerio('#editassociated').html()) !== null && _b !== void 0 ? _b : loadedCheerio('#editassociated').text();
                        altTitles = (associatedHtml || '')
                            .replace(/<br\s*\/?>/gi, '\n')
                            .replace(/<[^>]+>/g, '')
                            .split('\n')
                            .map(function (line) { return line.replace(/\s+/g, ' ').trim(); })
                            .filter(function (line) { return line && !/^associated\s*names?/i.test(line); });
                        statsText = loadedCheerio('.seriesother')
                            .text()
                            .replace(/\s+/g, ' ')
                            .trim();
                        statsSources = [statusRaw, statsText].filter(Boolean).join(' | ');
                        metaLines = [];
                        if (type && !summaryRaw.includes(type))
                            metaLines.push("Type: ".concat(type));
                        chapterCount = (_c = statsSources.match(/([\d,]+)\s*chapters?/i)) === null || _c === void 0 ? void 0 : _c[1];
                        if (chapterCount)
                            metaLines.push("Chapters: ".concat(chapterCount));
                        extraCount = (_d = statsSources.match(/([\d,]+)\s*extras?/i)) === null || _d === void 0 ? void 0 : _d[1];
                        if (extraCount)
                            metaLines.push("Extras: ".concat(extraCount));
                        volumeCount = (_e = statsSources.match(/([\d,]+)\s*volumes?/i)) === null || _e === void 0 ? void 0 : _e[1];
                        if (volumeCount)
                            metaLines.push("Volumes: ".concat(volumeCount));
                        unseenAltTitles = altTitles.filter(function (title) { return !summaryRaw.includes(title); });
                        summary = [summaryRaw, metaLines.join('\n')]
                            .filter(Boolean)
                            .join('\n\n');
                        summaryWithAltTitles = unseenAltTitles.length > 0
                            ? [summary, "Associated Names:\n".concat(unseenAltTitles.join('\n'))]
                                .filter(Boolean)
                                .join('\n\n')
                            : summary;
                        ratingMatch = (loadedCheerio('.seriesother .uvotes').text() ||
                            loadedCheerio('.uvotes').text()).match(/(\d+(?:\.\d+)?)\s*\/\s*\d+(?:\.\d+)?/);
                        rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
                        return [2 /*return*/, {
                                path: novelPath,
                                name: name,
                                cover: cover,
                                author: author,
                                artist: artist,
                                genres: genres,
                                status: status,
                                summary: summaryWithAltTitles || undefined,
                                rating: rating,
                                chapters: [],
                            }];
                }
            });
        });
    };
    NovelUpdates.prototype.parseChapter = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // NovelUpdates hosts no readable chapter content (encyclopedia/metadata
                // source). Fail clearly instead of pretending chapters can be read.
                throw new Error('NovelUpdates is an encyclopedia/metadata source and does not host readable chapter content. Open the series page to find the original translator site.');
            });
        });
    };
    NovelUpdates.prototype.searchNovels = function (searchTerm, page) {
        return __awaiter(this, void 0, void 0, function () {
            var splits, longestSearchTerm, url, body, loadedCheerio;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        splits = searchTerm.split('*');
                        longestSearchTerm = splits.reduce(function (a, b) { return (a.length > b.length ? a : b); }, '');
                        searchTerm = longestSearchTerm.replace(/[‘’]/g, "'").replace(/\s+/g, '+');
                        url = "".concat(this.site, "series-finder/?sf=1&sh=").concat(searchTerm, "&sort=srank&order=asc&pg=").concat(page);
                        return [4 /*yield*/, this.fetchDocument(url)];
                    case 1:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        return [2 /*return*/, this.parseNovels(loadedCheerio)];
                }
            });
        });
    };
    return NovelUpdates;
}());
exports.default = new NovelUpdates();
