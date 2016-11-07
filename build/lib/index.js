"use strict";
const visitor_1 = require("./visitor");
var visitor_2 = require("./visitor");
exports.SQLLang = visitor_2.SQLLang;
const odata_v4_parser_1 = require("odata-v4-parser");
function createQuery(odataQuery, options = {}) {
    let ast = (typeof odataQuery == "string" ? odata_v4_parser_1.query(odataQuery) : odataQuery);
    return new visitor_1.Visitor(options).Visit(ast).asType();
}
exports.createQuery = createQuery;
function createFilter(odataFilter, options = {}) {
    let ast = (typeof odataFilter == "string" ? odata_v4_parser_1.filter(odataFilter) : odataFilter);
    return new visitor_1.Visitor(options).Visit(ast).asType();
}
exports.createFilter = createFilter;
//# sourceMappingURL=index.js.map