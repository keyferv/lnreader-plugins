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
        this.version = '1.5.0';
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
    /** Genera un slug URL-friendly desde un título (similar al del sitio). */
    IchijouTranslations.prototype.slugify = function (text) {
        return text
            .toLowerCase()
            .replace(/[',¡!¿?.:;()["]]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };
    /** Escapa caracteres HTML en texto plano. */
    IchijouTranslations.prototype.escapeHtml = function (text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    };
    /** Renderiza un nodo inline (text con marks, hardBreak). */
    IchijouTranslations.prototype.renderInlineNode = function (node) {
        var _a;
        if (node.type === 'text') {
            var text = this.escapeHtml((_a = node.text) !== null && _a !== void 0 ? _a : '');
            if (node.marks) {
                for (var _i = 0, _b = node.marks; _i < _b.length; _i++) {
                    var mark = _b[_i];
                    switch (mark.type) {
                        case 'italic':
                            text = "<em>".concat(text, "</em>");
                            break;
                        case 'bold':
                            text = "<strong>".concat(text, "</strong>");
                            break;
                        case 'underline':
                            text = "<u>".concat(text, "</u>");
                            break;
                        case 'strike':
                            text = "<s>".concat(text, "</s>");
                            break;
                        case 'code':
                            text = "<code>".concat(text, "</code>");
                            break;
                    }
                }
            }
            return text;
        }
        if (node.type === 'hardBreak')
            return '<br />';
        return '';
    };
    /** Renderiza un nodo Tiptap de nivel bloque (paragraph, heading, inlineImage, hardBreak). */
    IchijouTranslations.prototype.renderTiptapNode = function (node) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        switch (node.type) {
            case 'paragraph': {
                var align = (_a = node.attrs) === null || _a === void 0 ? void 0 : _a.textAlign;
                var style = align ? " style=\"text-align:".concat(align, "\"") : '';
                var children = (_c = (_b = node.content) === null || _b === void 0 ? void 0 : _b.map(function (n) { return _this.renderInlineNode(n); }).join('')) !== null && _c !== void 0 ? _c : '';
                return "<p".concat(style, ">").concat(children || '<br />', "</p>");
            }
            case 'heading': {
                var level = (_e = (_d = node.attrs) === null || _d === void 0 ? void 0 : _d.level) !== null && _e !== void 0 ? _e : 2;
                var tag = level >= 1 && level <= 6 ? "h".concat(level) : 'h2';
                var align = (_f = node.attrs) === null || _f === void 0 ? void 0 : _f.textAlign;
                var style = align ? " style=\"text-align:".concat(align, "\"") : '';
                var children = (_h = (_g = node.content) === null || _g === void 0 ? void 0 : _g.map(function (n) { return _this.renderInlineNode(n); }).join('')) !== null && _h !== void 0 ? _h : '';
                return "<".concat(tag).concat(style, ">").concat(children, "</").concat(tag, ">");
            }
            case 'inlineImage': {
                var attrs = node.attrs;
                // Preferir md (medium), luego sm, luego original
                var src = ((_j = attrs === null || attrs === void 0 ? void 0 : attrs.urls) === null || _j === void 0 ? void 0 : _j.md) || ((_k = attrs === null || attrs === void 0 ? void 0 : attrs.urls) === null || _k === void 0 ? void 0 : _k.sm) || ((_l = attrs === null || attrs === void 0 ? void 0 : attrs.urls) === null || _l === void 0 ? void 0 : _l.original);
                if (!src)
                    return '';
                return "<img src=\"".concat(src, "\" style=\"display:block;width:100%;height:auto;margin:8px 0;\" />");
            }
            case 'hardBreak':
                return '<br />';
            case 'horizontalRule':
                return '<hr />';
            case 'blockquote': {
                var children = (_o = (_m = node.content) === null || _m === void 0 ? void 0 : _m.map(function (n) { return _this.renderTiptapNode(n); }).join('\n')) !== null && _o !== void 0 ? _o : '';
                return "<blockquote>".concat(children, "</blockquote>");
            }
            default:
                return '';
        }
    };
    /** Convierte un documento Tiptap (ProseMirror) a HTML. */
    IchijouTranslations.prototype.renderTiptap = function (doc) {
        var _this = this;
        var _a;
        if (!((_a = doc === null || doc === void 0 ? void 0 : doc.content) === null || _a === void 0 ? void 0 : _a.length))
            return '';
        return doc.content
            .map(function (node) { return _this.renderTiptapNode(node); })
            .filter(Boolean)
            .join('\n');
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
            var pathSegment, workId, workSlug, url, result, body, work, coverImage, cover, genres, chapters, chapterNumber, volumes, sortedVolumes, _i, sortedVolumes_1, volume, fileUrl, rootChapters, sortedChapters, _a, sortedChapters_1, chapter, fileUrl, pdfPath, chapterSlug;
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            return __generator(this, function (_m) {
                switch (_m.label) {
                    case 0:
                        pathSegment = (_b = novelPath.split('/').pop()) !== null && _b !== void 0 ? _b : '';
                        workId = (_c = pathSegment.match(/^(\d+)/)) === null || _c === void 0 ? void 0 : _c[1];
                        if (!workId)
                            throw new Error('No se pudo obtener el ID de la obra');
                        workSlug = pathSegment.replace(/^\d+-/, '');
                        url = "".concat(this.apiHomeBase, "/works/").concat(workId);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        result = _m.sent();
                        return [4 /*yield*/, result.json()];
                    case 2:
                        body = (_m.sent());
                        work = body.data;
                        coverImage = (_e = (_d = work.workImages) === null || _d === void 0 ? void 0 : _d.find(function (img) { return img.image_type.code === 'card' && img.image_url; })) !== null && _e !== void 0 ? _e : (_f = work.workImages) === null || _f === void 0 ? void 0 : _f.find(function (img) { return img.image_type.code === 'cover' && img.image_url; });
                        cover = (coverImage === null || coverImage === void 0 ? void 0 : coverImage.image_url)
                            ? this.buildCdnUrl(coverImage.image_url)
                            : undefined;
                        genres = ((_g = work.workGenres) === null || _g === void 0 ? void 0 : _g.map(function (g) { return g.genre.name; })) || [];
                        chapters = [];
                        chapterNumber = 0;
                        volumes = Array.isArray(work.volumes) ? work.volumes : [];
                        if (volumes.length) {
                            sortedVolumes = __spreadArray([], volumes, true).sort(function (a, b) { return a.orderIndex - b.orderIndex; });
                            for (_i = 0, sortedVolumes_1 = sortedVolumes; _i < sortedVolumes_1.length; _i++) {
                                volume = sortedVolumes_1[_i];
                                fileUrl = volume.fileUrl || ((_h = volume.volume_file) === null || _h === void 0 ? void 0 : _h.fileUrl);
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
                                fileUrl = chapter.fileUrl || ((_j = chapter.chapterFile) === null || _j === void 0 ? void 0 : _j.fileUrl);
                                pdfPath = fileUrl && this.isPdfFile(fileUrl) ? this.buildCdnUrl(fileUrl) : null;
                                chapterSlug = this.slugify(chapter.title);
                                chapters.push({
                                    name: "Cap\u00EDtulo ".concat(chapter.orderIndex, ": ").concat(chapter.title),
                                    path: pdfPath !== null && pdfPath !== void 0 ? pdfPath : "/capitulo/".concat(chapter.id, "/").concat(workSlug, "/").concat(chapterSlug),
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
                                status: (_l = (_k = work.publicationStatus) === null || _k === void 0 ? void 0 : _k.name) === null || _l === void 0 ? void 0 : _l.trim(),
                                genres: genres.join(', '),
                                chapters: chapters,
                            }];
                }
            });
        });
    };
    IchijouTranslations.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var pdfUrl, relativePath, pdfUrl, parts_1, chapterId, workSlug_1, chapterSlug_1, oldUrl, oldResult, oldBody, oldContent, _a, chapterApiFailed, chapterKey, newUrl, newResult, newBody, chapter, rawContent, sortedImages, _b, readerUrl, readerResult, readerBody, readerContent, _c, parts, id, oldUrl, oldResult, oldBody, oldContent, _d, fallbackChapterApiFailed, workSlug, chapterSlug, chapterKey, newUrl, newResult, newBody, chapter, rawContent, sortedImages, _e, readerUrl, readerResult, readerBody, readerContent, _f;
            var _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
            return __generator(this, function (_3) {
                switch (_3.label) {
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
                        if (!chapterPath.startsWith('/capitulo/')) return [3 /*break*/, 17];
                        parts_1 = chapterPath.split('/').filter(Boolean);
                        chapterId = (_h = (_g = parts_1[1]) === null || _g === void 0 ? void 0 : _g.match(/^(\d+)/)) === null || _h === void 0 ? void 0 : _h[1];
                        if (!chapterId)
                            throw new Error('No se pudo obtener el ID del capítulo');
                        workSlug_1 = (_j = parts_1[2]) !== null && _j !== void 0 ? _j : '';
                        chapterSlug_1 = (_k = parts_1[3]) !== null && _k !== void 0 ? _k : '';
                        _3.label = 1;
                    case 1:
                        _3.trys.push([1, 5, , 6]);
                        oldUrl = "".concat(this.apiSite, "/home/chapter/").concat(chapterId);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(oldUrl)];
                    case 2:
                        oldResult = _3.sent();
                        if (!oldResult.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, oldResult.json()];
                    case 3:
                        oldBody = (_3.sent());
                        oldContent = (_o = (_m = (_l = oldBody.data) === null || _l === void 0 ? void 0 : _l.content) !== null && _m !== void 0 ? _m : oldBody.content) !== null && _o !== void 0 ? _o : '';
                        if (oldContent)
                            return [2 /*return*/, oldContent];
                        _3.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        _a = _3.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        chapterApiFailed = true;
                        if (!(workSlug_1 && chapterSlug_1)) return [3 /*break*/, 11];
                        chapterKey = "".concat(chapterId, "-").concat(chapterSlug_1);
                        newUrl = "".concat(this.apiHomeBase, "/works/").concat(workSlug_1, "/chapters/").concat(chapterKey);
                        _3.label = 7;
                    case 7:
                        _3.trys.push([7, 10, , 11]);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(newUrl)];
                    case 8:
                        newResult = _3.sent();
                        return [4 /*yield*/, newResult.json()];
                    case 9:
                        newBody = (_3.sent());
                        chapter = (_p = newBody.data) === null || _p === void 0 ? void 0 : _p.chapter;
                        rawContent = chapter === null || chapter === void 0 ? void 0 : chapter.content;
                        // 1. Imágenes (manhwa) — ordenar por pageIndex y generar HTML
                        if (!rawContent && ((_q = chapter === null || chapter === void 0 ? void 0 : chapter.images) === null || _q === void 0 ? void 0 : _q.length)) {
                            chapterApiFailed = false;
                            sortedImages = __spreadArray([], chapter.images, true).sort(function (a, b) { return a.pageIndex - b.pageIndex; });
                            return [2 /*return*/, sortedImages
                                    .map(function (img) {
                                    return "<img src=\"".concat(img.imageUrl, "\" style=\"display:block;width:100%;height:auto;margin:0;\" />");
                                })
                                    .join('\n')];
                        }
                        // 2. Contenido string: PDF o HTML
                        if (typeof rawContent === 'string' && rawContent.length > 0) {
                            chapterApiFailed = false;
                            if (this.isPdfFile(rawContent)) {
                                return [2 /*return*/, ('<div style="text-align:center;padding:32px 16px;font-family:sans-serif;">' +
                                        '<p style="font-size:18px;margin-bottom:24px;">Este capítulo está en formato PDF.</p>' +
                                        "<a href=\"".concat(rawContent, "\" style=\"display:inline-block;padding:14px 28px;") +
                                        'background:#1976D2;color:#fff;text-decoration:none;border-radius:8px;' +
                                        'font-size:16px;">Abrir PDF</a></div>')];
                            }
                            return [2 /*return*/, rawContent]; // HTML viejo
                        }
                        // 3. Contenido es objeto Tiptap → el reader endpoint resuelve URLs de imágenes
                        if (rawContent && typeof rawContent === 'object') {
                            // Caemos al intento 3 (reader) que devuelve URLs firmadas de R2
                        }
                        return [3 /*break*/, 11];
                    case 10:
                        _b = _3.sent();
                        return [3 /*break*/, 11];
                    case 11:
                        _3.trys.push([11, 15, , 16]);
                        readerUrl = "".concat(this.apiHomeBase, "/").concat(chapterId, "/reader");
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(readerUrl)];
                    case 12:
                        readerResult = _3.sent();
                        if (!readerResult.ok) return [3 /*break*/, 14];
                        return [4 /*yield*/, readerResult.json()];
                    case 13:
                        readerBody = (_3.sent());
                        readerContent = (_r = readerBody.data) === null || _r === void 0 ? void 0 : _r.content;
                        if ((_s = readerContent === null || readerContent === void 0 ? void 0 : readerContent.content) === null || _s === void 0 ? void 0 : _s.length) {
                            return [2 /*return*/, this.renderTiptap(readerContent)];
                        }
                        _3.label = 14;
                    case 14: return [3 /*break*/, 16];
                    case 15:
                        _c = _3.sent();
                        return [3 /*break*/, 16];
                    case 16:
                        if (!chapterApiFailed) {
                            // La API de capítulo dijo que sí encontró algo pero no pudimos
                            // renderizarlo — probablemente Tiptap sin URLs de imagen
                            throw new Error('No se pudo renderizar el contenido Tiptap del capítulo');
                        }
                        throw new Error('No se encontró contenido del capítulo');
                    case 17:
                        parts = chapterPath.split('/').filter(Boolean);
                        id = (_u = (_t = parts.pop()) === null || _t === void 0 ? void 0 : _t.match(/^(\d+)/)) === null || _u === void 0 ? void 0 : _u[1];
                        if (!id)
                            throw new Error('No se pudo obtener el ID del capítulo');
                        _3.label = 18;
                    case 18:
                        _3.trys.push([18, 22, , 23]);
                        oldUrl = "".concat(this.apiSite, "/home/chapter/").concat(id);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(oldUrl)];
                    case 19:
                        oldResult = _3.sent();
                        if (!oldResult.ok) return [3 /*break*/, 21];
                        return [4 /*yield*/, oldResult.json()];
                    case 20:
                        oldBody = (_3.sent());
                        oldContent = (_x = (_w = (_v = oldBody.data) === null || _v === void 0 ? void 0 : _v.content) !== null && _w !== void 0 ? _w : oldBody.content) !== null && _x !== void 0 ? _x : '';
                        if (oldContent)
                            return [2 /*return*/, oldContent];
                        _3.label = 21;
                    case 21: return [3 /*break*/, 23];
                    case 22:
                        _d = _3.sent();
                        return [3 /*break*/, 23];
                    case 23:
                        fallbackChapterApiFailed = true;
                        workSlug = parts.length >= 1 ? parts.join('/') : '';
                        chapterSlug = parts.length >= 2 ? (_y = parts.pop()) !== null && _y !== void 0 ? _y : '' : '';
                        if (!(workSlug && chapterSlug && id)) return [3 /*break*/, 28];
                        chapterKey = "".concat(id, "-").concat(chapterSlug);
                        newUrl = "".concat(this.apiHomeBase, "/works/").concat(workSlug, "/chapters/").concat(chapterKey);
                        _3.label = 24;
                    case 24:
                        _3.trys.push([24, 27, , 28]);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(newUrl)];
                    case 25:
                        newResult = _3.sent();
                        return [4 /*yield*/, newResult.json()];
                    case 26:
                        newBody = (_3.sent());
                        chapter = (_z = newBody.data) === null || _z === void 0 ? void 0 : _z.chapter;
                        rawContent = chapter === null || chapter === void 0 ? void 0 : chapter.content;
                        // 1. Imágenes (manhwa)
                        if (!rawContent && ((_0 = chapter === null || chapter === void 0 ? void 0 : chapter.images) === null || _0 === void 0 ? void 0 : _0.length)) {
                            fallbackChapterApiFailed = false;
                            sortedImages = __spreadArray([], chapter.images, true).sort(function (a, b) { return a.pageIndex - b.pageIndex; });
                            return [2 /*return*/, sortedImages
                                    .map(function (img) {
                                    return "<img src=\"".concat(img.imageUrl, "\" style=\"display:block;width:100%;height:auto;margin:0;\" />");
                                })
                                    .join('\n')];
                        }
                        // 2. Contenido string: PDF o HTML
                        if (typeof rawContent === 'string' && rawContent.length > 0) {
                            fallbackChapterApiFailed = false;
                            if (this.isPdfFile(rawContent)) {
                                return [2 /*return*/, ('<div style="text-align:center;padding:32px 16px;font-family:sans-serif;">' +
                                        '<p style="font-size:18px;margin-bottom:24px;">Este capítulo está en formato PDF.</p>' +
                                        "<a href=\"".concat(rawContent, "\" style=\"display:inline-block;padding:14px 28px;") +
                                        'background:#1976D2;color:#fff;text-decoration:none;border-radius:8px;' +
                                        'font-size:16px;">Abrir PDF</a></div>')];
                            }
                            return [2 /*return*/, rawContent]; // HTML viejo
                        }
                        return [3 /*break*/, 28];
                    case 27:
                        _e = _3.sent();
                        return [3 /*break*/, 28];
                    case 28:
                        _3.trys.push([28, 32, , 33]);
                        readerUrl = "".concat(this.apiHomeBase, "/").concat(id, "/reader");
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(readerUrl)];
                    case 29:
                        readerResult = _3.sent();
                        if (!readerResult.ok) return [3 /*break*/, 31];
                        return [4 /*yield*/, readerResult.json()];
                    case 30:
                        readerBody = (_3.sent());
                        readerContent = (_1 = readerBody.data) === null || _1 === void 0 ? void 0 : _1.content;
                        if ((_2 = readerContent === null || readerContent === void 0 ? void 0 : readerContent.content) === null || _2 === void 0 ? void 0 : _2.length) {
                            return [2 /*return*/, this.renderTiptap(readerContent)];
                        }
                        _3.label = 31;
                    case 31: return [3 /*break*/, 33];
                    case 32:
                        _f = _3.sent();
                        return [3 /*break*/, 33];
                    case 33:
                        if (!fallbackChapterApiFailed) {
                            throw new Error('No se pudo renderizar el contenido Tiptap del capítulo');
                        }
                        throw new Error('No se encontró contenido del capítulo');
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
