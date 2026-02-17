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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var fetch_1 = require("@libs/fetch");
var filterInputs_1 = require("@libs/filterInputs");
var IchijouTranslations = /** @class */ (function () {
    function IchijouTranslations() {
        this.id = 'ichijoutranslations';
        this.name = 'Ichijou Translations';
        this.site = 'https://www.ichijoutranslations.com';
        this.apiSite = 'https://api.ichijoutranslations.com/api';
        this.apiRoot = 'https://api.ichijoutranslations.com';
        this.cdnSite = 'https://cdn.ichijoutranslations.com';
        this.apiHomeBase = 'https://api.ichijoutranslations.com/api/home';
        this.version = '1.2.0';
        this.icon = 'src/es/ichijoutranslations/icon.png';
        this.lang = 'Spanish';
        this.filters = {
            sortBy: {
                type: filterInputs_1.FilterTypes.Picker,
                label: 'Ordenar por',
                value: 'title',
                options: [
                    { label: 'Título', value: 'title' },
                    { label: 'Agregado', value: 'createdAt' },
                    { label: 'Actualizado', value: 'updatedAt' },
                    { label: 'Vistas', value: 'views' },
                ],
            },
            sortOrder: {
                type: filterInputs_1.FilterTypes.Picker,
                label: 'Orden',
                value: 'ASC',
                options: [
                    { label: 'Ascendente', value: 'ASC' },
                    { label: 'Descendente', value: 'DESC' },
                ],
            },
        };
    }
    IchijouTranslations.prototype.buildCdnUrl = function (relativePath) {
        if (relativePath.startsWith('http'))
            return relativePath;
        return (this.cdnSite +
            (relativePath.startsWith('/') ? relativePath : "/".concat(relativePath)));
    };
    IchijouTranslations.prototype.isPdfFile = function (fileUrl) {
        return /\.pdf(\?|$)/i.test(fileUrl);
    };
    IchijouTranslations.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var sortBy, sortOrder, url, result, body, novels;
            var _this = this;
            var _c, _d;
            var filters = _b.filters;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        sortBy = ((_c = filters === null || filters === void 0 ? void 0 : filters.sortBy) === null || _c === void 0 ? void 0 : _c.value) || this.filters.sortBy.value;
                        sortOrder = ((_d = filters === null || filters === void 0 ? void 0 : filters.sortOrder) === null || _d === void 0 ? void 0 : _d.value) || this.filters.sortOrder.value;
                        url = "".concat(this.apiSite, "/home/explore?page=").concat(pageNo, "&limit=12&sortBy=").concat(sortBy, "&sortOrder=").concat(sortOrder);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        result = _e.sent();
                        return [4 /*yield*/, result.json()];
                    case 2:
                        body = (_e.sent());
                        novels = [];
                        body.data.data.forEach(function (work) {
                            var coverImage = work.workImages.find(function (img) { return img.image_type.code === 'card' && img.image_url; }) ||
                                work.workImages.find(function (img) { return img.image_type.code === 'cover' && img.image_url; });
                            var cover = (coverImage === null || coverImage === void 0 ? void 0 : coverImage.image_url)
                                ? _this.buildCdnUrl(coverImage.image_url)
                                : undefined;
                            novels.push({
                                name: work.title,
                                cover: cover,
                                path: "/obras/".concat(work.id, "-").concat(work.slug),
                            });
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    IchijouTranslations.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var slug, url, result, body, work, coverImage, cover, genres, chapters, chapterNumber, volumes, sortedVolumes, _i, sortedVolumes_1, volume, fileUrl, rootChapters, sortedChapters, _a, sortedChapters_1, chapter, fileUrl, pdfPath;
            var _b, _c, _d, _e, _f, _g, _h, _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        slug = novelPath.split('/').pop();
                        if (!slug)
                            throw new Error('No se pudo obtener el slug de la novela');
                        url = "".concat(this.apiHomeBase, "/works/").concat(slug);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        result = _k.sent();
                        return [4 /*yield*/, result.json()];
                    case 2:
                        body = (_k.sent());
                        work = body.data;
                        coverImage = (_c = (_b = work.workImages) === null || _b === void 0 ? void 0 : _b.find(function (img) { return img.image_type.code === 'card' && img.image_url; })) !== null && _c !== void 0 ? _c : (_d = work.workImages) === null || _d === void 0 ? void 0 : _d.find(function (img) { return img.image_type.code === 'cover' && img.image_url; });
                        cover = (coverImage === null || coverImage === void 0 ? void 0 : coverImage.image_url)
                            ? this.buildCdnUrl(coverImage.image_url)
                            : undefined;
                        genres = ((_e = work.workGenres) === null || _e === void 0 ? void 0 : _e.map(function (g) { return g.genre.name; })) || [];
                        chapters = [];
                        chapterNumber = 0;
                        volumes = Array.isArray(work.volumes) ? work.volumes : [];
                        if (volumes.length) {
                            sortedVolumes = __spreadArray([], volumes, true).sort(function (a, b) { return a.orderIndex - b.orderIndex; });
                            for (_i = 0, sortedVolumes_1 = sortedVolumes; _i < sortedVolumes_1.length; _i++) {
                                volume = sortedVolumes_1[_i];
                                fileUrl = volume.fileUrl || ((_f = volume.volume_file) === null || _f === void 0 ? void 0 : _f.fileUrl);
                                if (fileUrl && this.isPdfFile(fileUrl)) {
                                    chapterNumber++;
                                    chapters.push({
                                        name: "Volumen ".concat(volume.orderIndex, ": ").concat(volume.title),
                                        path: this.buildCdnUrl(fileUrl),
                                        releaseTime: volume.createdAt,
                                        chapterNumber: chapterNumber,
                                    });
                                }
                            }
                        }
                        rootChapters = Array.isArray(work.chapters) ? work.chapters : [];
                        if (rootChapters.length) {
                            sortedChapters = __spreadArray([], rootChapters, true).sort(function (a, b) { return a.orderIndex - b.orderIndex; });
                            for (_a = 0, sortedChapters_1 = sortedChapters; _a < sortedChapters_1.length; _a++) {
                                chapter = sortedChapters_1[_a];
                                chapterNumber++;
                                fileUrl = chapter.fileUrl || ((_g = chapter.chapterFile) === null || _g === void 0 ? void 0 : _g.fileUrl);
                                pdfPath = fileUrl && this.isPdfFile(fileUrl) ? this.buildCdnUrl(fileUrl) : null;
                                chapters.push({
                                    name: "Cap\u00EDtulo ".concat(chapter.orderIndex, ": ").concat(chapter.title),
                                    path: pdfPath !== null && pdfPath !== void 0 ? pdfPath : "/capitulo/".concat(chapter.id),
                                    releaseTime: chapter.createdAt,
                                    chapterNumber: chapterNumber,
                                });
                            }
                        }
                        return [2 /*return*/, {
                                path: novelPath,
                                name: work.title,
                                cover: cover,
                                summary: work.synopsis,
                                status: (_j = (_h = work.publicationStatus) === null || _h === void 0 ? void 0 : _h.name) === null || _j === void 0 ? void 0 : _j.trim(),
                                genres: genres.join(', '),
                                chapters: chapters,
                            }];
                }
            });
        });
    };
    IchijouTranslations.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var pdfUrl, relativePath, pdfUrl, chapterId, url_1, result_1, body_1, content_1, id, url, result, body, content;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return __generator(this, function (_l) {
                switch (_l.label) {
                    case 0:
                        // PDF directo (URL CDN completa) — la app redirige a PdfReaderScreen antes
                        // de llegar aquí, pero lo dejamos como fallback por si acaso.
                        if (this.isPdfFile(chapterPath)) {
                            pdfUrl = chapterPath.startsWith('http')
                                ? chapterPath
                                : this.buildCdnUrl(chapterPath);
                            return [2 /*return*/, ('<div style="text-align:center;padding:32px 16px;font-family:sans-serif;">' +
                                    '<p style="font-size:18px;margin-bottom:24px;">Este capítulo está en formato PDF.</p>' +
                                    "<a href=\"".concat(pdfUrl, "\" style=\"display:inline-block;padding:14px 28px;") +
                                    'background:#1976D2;color:#fff;text-decoration:none;border-radius:8px;' +
                                    'font-size:16px;">Abrir PDF</a></div>')];
                        }
                        // Backward compat: rutas /leer-pdf/ antiguas
                        if (chapterPath.includes('/leer-pdf/')) {
                            relativePath = chapterPath.replace('/leer-pdf', '');
                            pdfUrl = this.buildCdnUrl(relativePath);
                            return [2 /*return*/, ('<div style="text-align:center;padding:32px 16px;font-family:sans-serif;">' +
                                    '<p style="font-size:18px;margin-bottom:24px;">Este capítulo está en formato PDF.</p>' +
                                    "<a href=\"".concat(pdfUrl, "\" style=\"display:inline-block;padding:14px 28px;") +
                                    'background:#1976D2;color:#fff;text-decoration:none;border-radius:8px;' +
                                    'font-size:16px;">Abrir PDF</a></div>')];
                        }
                        if (!chapterPath.startsWith('/capitulo/')) return [3 /*break*/, 3];
                        chapterId = (_b = (_a = chapterPath
                            .split('/')
                            .pop()) === null || _a === void 0 ? void 0 : _a.match(/^(\d+)/)) === null || _b === void 0 ? void 0 : _b[1];
                        if (!chapterId)
                            throw new Error('No se pudo obtener el ID del capítulo');
                        url_1 = "".concat(this.apiSite, "/home/chapter/").concat(chapterId);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url_1)];
                    case 1:
                        result_1 = _l.sent();
                        return [4 /*yield*/, result_1.json()];
                    case 2:
                        body_1 = (_l.sent());
                        content_1 = (_e = (_d = (_c = body_1.data) === null || _c === void 0 ? void 0 : _c.content) !== null && _d !== void 0 ? _d : body_1.content) !== null && _e !== void 0 ? _e : '';
                        if (!content_1)
                            throw new Error('No se encontró contenido del capítulo');
                        return [2 /*return*/, content_1];
                    case 3:
                        id = (_g = (_f = chapterPath
                            .split('/')
                            .pop()) === null || _f === void 0 ? void 0 : _f.match(/^(\d+)/)) === null || _g === void 0 ? void 0 : _g[1];
                        if (!id)
                            throw new Error('No se pudo obtener el ID del capítulo');
                        url = "".concat(this.apiSite, "/home/chapter/").concat(id);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 4:
                        result = _l.sent();
                        return [4 /*yield*/, result.json()];
                    case 5:
                        body = (_l.sent());
                        content = (_k = (_j = (_h = body.data) === null || _h === void 0 ? void 0 : _h.content) !== null && _j !== void 0 ? _j : body.content) !== null && _k !== void 0 ? _k : '';
                        if (!content)
                            throw new Error('No se encontró contenido del capítulo');
                        return [2 /*return*/, content];
                }
            });
        });
    };
    IchijouTranslations.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var sortBy, sortOrder, url, result, body, novels;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sortBy = this.filters.sortBy.value;
                        sortOrder = this.filters.sortOrder.value;
                        url = "".concat(this.apiSite, "/home/explore?page=").concat(pageNo, "&limit=12&sortBy=").concat(sortBy, "&sortOrder=").concat(sortOrder, "&search=").concat(encodeURIComponent(searchTerm));
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, result.json()];
                    case 2:
                        body = (_a.sent());
                        novels = [];
                        body.data.data.forEach(function (work) {
                            var coverImage = work.workImages.find(function (img) { return img.image_type.code === 'card' && img.image_url; }) ||
                                work.workImages.find(function (img) { return img.image_type.code === 'cover' && img.image_url; });
                            var cover = (coverImage === null || coverImage === void 0 ? void 0 : coverImage.image_url)
                                ? _this.buildCdnUrl(coverImage.image_url)
                                : undefined;
                            novels.push({
                                name: work.title,
                                cover: cover,
                                path: "/obras/".concat(work.id, "-").concat(work.slug),
                            });
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    return IchijouTranslations;
}());
exports.default = new IchijouTranslations();
