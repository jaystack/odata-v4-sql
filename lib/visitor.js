"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const odata_v4_literal_1 = require("odata-v4-literal");
class SQLLiteral extends odata_v4_literal_1.Literal {
    static convert(type, value) {
        return (new SQLLiteral(type, value)).valueOf();
    }
    'Edm.String'(value) { return "'" + decodeURIComponent(value).slice(1, -1).replace(/''/g, "'") + "'"; }
    'Edm.Guid'(value) { return "'" + decodeURIComponent(value) + "'"; }
    'Edm.Date'(value) { return "'" + value + "'"; }
    'Edm.DateTimeOffset'(value) { return "'" + value.replace("T", " ").replace("Z", " ").trim() + "'"; }
    'Edm.Boolean'(value) {
        value = value || '';
        switch (value.toLowerCase()) {
            case 'true': return 1;
            case 'false': return 0;
            default: return "NULL";
        }
    }
    'null'(value) { return "NULL"; }
}
exports.SQLLiteral = SQLLiteral;
var SQLLang;
(function (SQLLang) {
    SQLLang[SQLLang["ANSI"] = 0] = "ANSI";
    SQLLang[SQLLang["MsSql"] = 1] = "MsSql";
    SQLLang[SQLLang["MySql"] = 2] = "MySql";
    SQLLang[SQLLang["PostgreSql"] = 3] = "PostgreSql";
    SQLLang[SQLLang["Oracle"] = 4] = "Oracle";
})(SQLLang = exports.SQLLang || (exports.SQLLang = {}));
class Visitor {
    constructor(options = {}) {
        this.select = "";
        this.where = "";
        this.orderby = "";
        this.includes = [];
        this.parameters = new Map();
        this.parameterSeed = 0;
        this.options = options;
        if (this.options.useParameters != false)
            this.options.useParameters = true;
        this.type = options.type || SQLLang.ANSI;
    }
    from(table) {
        let sql = `SELECT ${this.select} FROM [${table}] WHERE ${this.where} ORDER BY ${this.orderby}`;
        switch (this.type) {
            case SQLLang.Oracle:
            case SQLLang.MsSql:
                if (typeof this.skip == "number")
                    sql += ` OFFSET ${this.skip} ROWS`;
                if (typeof this.limit == "number") {
                    if (typeof this.skip != "number")
                        sql += " OFFSET 0 ROWS";
                    sql += ` FETCH NEXT ${this.limit} ROWS ONLY`;
                }
                break;
            case SQLLang.MySql:
            case SQLLang.PostgreSql:
            default:
                if (typeof this.limit == "number")
                    sql += ` LIMIT ${this.limit}`;
                if (typeof this.skip == "number")
                    sql += ` OFFSET ${this.skip}`;
                break;
        }
        return sql;
    }
    asMsSql() {
        this.type = SQLLang.MsSql;
        let rx = new RegExp("\\?", "g");
        let keys = this.parameters.keys();
        this.originalWhere = this.where;
        this.where = this.where.replace(rx, () => `@${keys.next().value}`);
        this.includes.forEach((item) => item.asMsSql());
        return this;
    }
    asOracleSql() {
        this.type = SQLLang.Oracle;
        let rx = new RegExp("\\?", "g");
        let keys = this.parameters.keys();
        this.originalWhere = this.where;
        this.where = this.where.replace(rx, () => `:${keys.next().value}`);
        this.includes.forEach((item) => item.asOracleSql());
        return this;
    }
    asAnsiSql() {
        this.type = SQLLang.ANSI;
        this.where = this.originalWhere || this.where;
        this.includes.forEach((item) => item.asAnsiSql());
        return this;
    }
    asType() {
        switch (this.type) {
            case SQLLang.MsSql: return this.asMsSql();
            case SQLLang.ANSI:
            case SQLLang.MySql:
            case SQLLang.PostgreSql: return this.asAnsiSql();
            case SQLLang.Oracle: return this.asOracleSql();
            default: return this;
        }
    }
    Visit(node, context) {
        this.ast = this.ast || node;
        context = context || { target: "where" };
        if (node) {
            var visitor = this[`Visit${node.type}`];
            if (visitor)
                visitor.call(this, node, context);
            else
                console.log(`Unhandled node type: ${node.type}`, node);
        }
        if (node == this.ast) {
            if (!this.select)
                this.select = `*`;
            if (!this.where)
                this.where = "1 = 1";
            if (!this.orderby)
                this.orderby = "1";
        }
        return this;
    }
    VisitODataUri(node, context) {
        this.Visit(node.value.resource, context);
        this.Visit(node.value.query, context);
    }
    VisitExpand(node, context) {
        node.value.items.forEach((item) => {
            let expandPath = item.value.path.raw;
            let visitor = this.includes.filter(v => v.navigationProperty == expandPath)[0];
            if (!visitor) {
                visitor = new Visitor(this.options);
                visitor.parameterSeed = this.parameterSeed;
                this.includes.push(visitor);
            }
            visitor.Visit(item);
            this.parameterSeed = visitor.parameterSeed;
        });
    }
    VisitExpandItem(node, context) {
        this.Visit(node.value.path, context);
        if (node.value.options)
            node.value.options.forEach((item) => this.Visit(item, context));
    }
    VisitExpandPath(node, context) {
        this.navigationProperty = node.raw;
    }
    VisitQueryOptions(node, context) {
        node.value.options.forEach((option) => this.Visit(option, context));
    }
    VisitInlineCount(node, context) {
        this.inlinecount = odata_v4_literal_1.Literal.convert(node.value.value, node.value.raw);
    }
    VisitFilter(node, context) {
        context.target = "where";
        this.Visit(node.value, context);
        if (!this.where)
            this.where = "1 = 1";
    }
    VisitOrderBy(node, context) {
        context.target = "orderby";
        node.value.items.forEach((item, i) => {
            this.Visit(item, context);
            if (i < node.value.items.length - 1)
                this.orderby += ", ";
        });
    }
    VisitOrderByItem(node, context) {
        this.Visit(node.value.expr, context);
        this.orderby += node.value.direction > 0 ? " ASC" : " DESC";
    }
    VisitSkip(node, context) {
        this.skip = +node.value.raw;
    }
    VisitTop(node, context) {
        this.limit = +node.value.raw;
    }
    VisitSelect(node, context) {
        context.target = "select";
        node.value.items.forEach((item, i) => {
            this.Visit(item, context);
            if (i < node.value.items.length - 1)
                this.select += ", ";
        });
    }
    VisitSelectItem(node, context) {
        let item = node.raw.replace(/\//g, '.');
        this.select += `[${item}]`;
    }
    VisitAndExpression(node, context) {
        this.Visit(node.value.left, context);
        this.where += " AND ";
        this.Visit(node.value.right, context);
    }
    VisitOrExpression(node, context) {
        this.Visit(node.value.left, context);
        this.where += " OR ";
        this.Visit(node.value.right, context);
    }
    VisitBoolParenExpression(node, context) {
        this.where += "(";
        this.Visit(node.value, context);
        this.where += ")";
    }
    VisitCommonExpression(node, context) {
        this.Visit(node.value, context);
    }
    VisitFirstMemberExpression(node, context) {
        this.Visit(node.value, context);
    }
    VisitMemberExpression(node, context) {
        this.Visit(node.value, context);
    }
    VisitPropertyPathExpression(node, context) {
        if (node.value.current && node.value.next) {
            this.Visit(node.value.current, context);
            context.identifier += ".";
            this.Visit(node.value.next, context);
        }
        else
            this.Visit(node.value, context);
    }
    VisitSingleNavigationExpression(node, context) {
        if (node.value.current && node.value.next) {
            this.Visit(node.value.current, context);
            this.Visit(node.value.next, context);
        }
        else
            this.Visit(node.value, context);
    }
    VisitODataIdentifier(node, context) {
        this[context.target] += `[${node.value.name}]`;
        context.identifier = node.value.name;
    }
    VisitEqualsExpression(node, context) {
        this.Visit(node.value.left, context);
        this.where += " = ";
        this.Visit(node.value.right, context);
        if (this.options.useParameters && context.literal == null) {
            this.where = this.where.replace(/= \?$/, "IS NULL").replace(new RegExp(`\\? = \\[${context.identifier}\\]$`), `[${context.identifier}] IS NULL`);
        }
        else if (context.literal == "NULL") {
            this.where = this.where.replace(/= NULL$/, "IS NULL").replace(new RegExp(`NULL = \\[${context.identifier}\\]$`), `[${context.identifier}] IS NULL`);
        }
    }
    VisitNotEqualsExpression(node, context) {
        this.Visit(node.value.left, context);
        this.where += " <> ";
        this.Visit(node.value.right, context);
        if (this.options.useParameters && context.literal == null) {
            this.where = this.where.replace(/<> \?$/, "IS NOT NULL").replace(new RegExp(`\\? <> \\[${context.identifier}\\]$`), `[${context.identifier}] IS NOT NULL`);
        }
        else if (context.literal == "NULL") {
            this.where = this.where.replace(/<> NULL$/, "IS NOT NULL").replace(new RegExp(`NULL <> \\[${context.identifier}\\]$`), `[${context.identifier}] IS NOT NULL`);
        }
    }
    VisitLesserThanExpression(node, context) {
        this.Visit(node.value.left, context);
        this.where += " < ";
        this.Visit(node.value.right, context);
    }
    VisitLesserOrEqualsExpression(node, context) {
        this.Visit(node.value.left, context);
        this.where += " <= ";
        this.Visit(node.value.right, context);
    }
    VisitGreaterThanExpression(node, context) {
        this.Visit(node.value.left, context);
        this.where += " > ";
        this.Visit(node.value.right, context);
    }
    VisitGreaterOrEqualsExpression(node, context) {
        this.Visit(node.value.left, context);
        this.where += " >= ";
        this.Visit(node.value.right, context);
    }
    VisitLiteral(node, context) {
        if (this.options.useParameters) {
            let name = `p${this.parameterSeed++}`;
            let value = odata_v4_literal_1.Literal.convert(node.value, node.raw);
            context.literal = value;
            this.parameters.set(name, value);
            this.where += "?";
        }
        else
            this.where += (context.literal = SQLLiteral.convert(node.value, node.raw));
    }
    VisitMethodCallExpression(node, context) {
        var method = node.value.method;
        var params = node.value.parameters || [];
        switch (method) {
            case "contains":
                this.Visit(params[0], context);
                if (this.options.useParameters) {
                    let name = `p${this.parameterSeed++}`;
                    let value = odata_v4_literal_1.Literal.convert(params[1].value, params[1].raw);
                    this.parameters.set(name, `%${value}%`);
                    this.where += " like ?";
                }
                else
                    this.where += ` like '%${SQLLiteral.convert(params[1].value, params[1].raw).slice(1, -1)}%'`;
                break;
            case "endswith":
                this.Visit(params[0], context);
                if (this.options.useParameters) {
                    let name = `p${this.parameterSeed++}`;
                    let value = odata_v4_literal_1.Literal.convert(params[1].value, params[1].raw);
                    this.parameters.set(name, `%${value}`);
                    this.where += " like ?";
                }
                else
                    this.where += ` like '%${SQLLiteral.convert(params[1].value, params[1].raw).slice(1, -1)}'`;
                break;
            case "startswith":
                this.Visit(params[0], context);
                if (this.options.useParameters) {
                    let name = `p${this.parameterSeed++}`;
                    let value = odata_v4_literal_1.Literal.convert(params[1].value, params[1].raw);
                    this.parameters.set(name, `${value}%`);
                    this.where += " like ?";
                }
                else
                    this.where += ` like '${SQLLiteral.convert(params[1].value, params[1].raw).slice(1, -1)}%'`;
                break;
            case "round":
                this.where += "ROUND(";
                this.Visit(params[0], context);
                this.where += ")";
                break;
            case "length":
                this.where += "LEN(";
                this.Visit(params[0], context);
                this.where += ")";
                break;
            case "tolower":
                this.where += "LCASE(";
                this.Visit(params[0], context);
                this.where += ")";
                break;
            case "toupper":
                this.where += "UCASE(";
                this.Visit(params[0], context);
                this.where += ")";
                break;
            case "floor":
            case "ceiling":
            case "year":
            case "month":
            case "day":
            case "hour":
            case "minute":
            case "second":
                this.where += `${method.toUpperCase()}(`;
                this.Visit(params[0], context);
                this.where += ")";
                break;
            case "now":
                this.where += "NOW()";
                break;
            case "trim":
                this.where += "TRIM(' ' FROM ";
                this.Visit(params[0], context);
                this.where += ")";
                break;
        }
    }
}
exports.Visitor = Visitor;
//# sourceMappingURL=visitor.js.map