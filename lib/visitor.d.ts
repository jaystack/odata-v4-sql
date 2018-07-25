import { Token } from "odata-v4-parser/lib/lexer";
import { Literal } from "odata-v4-literal";
import { SqlOptions } from "./index";
export declare class SQLLiteral extends Literal {
    static convert(type: string, value: string): any;
    'Edm.String'(value: string): string;
    'Edm.Guid'(value: string): string;
    'Edm.Date'(value: string): string;
    'Edm.DateTimeOffset'(value: string): any;
    'Edm.Boolean'(value: string): any;
    'null'(value: string): string;
}
export declare enum SQLLang {
    ANSI = 0,
    MsSql = 1,
    MySql = 2,
    PostgreSql = 3,
    Oracle = 4
}
export declare class Visitor {
    protected options: SqlOptions;
    type: SQLLang;
    select: string;
    where: string;
    orderby: string;
    skip: number;
    limit: number;
    inlinecount: boolean;
    navigationProperty: string;
    includes: Visitor[];
    parameters: any;
    protected parameterSeed: number;
    protected originalWhere: string;
    ast: Token;
    constructor(options?: SqlOptions);
    from(table: string): string;
    asMsSql(): this;
    asOracleSql(): this;
    asAnsiSql(): this;
    asType(): this;
    Visit(node: Token, context?: any): this;
    protected VisitODataUri(node: Token, context: any): void;
    protected VisitExpand(node: Token, context: any): void;
    protected VisitExpandItem(node: Token, context: any): void;
    protected VisitExpandPath(node: Token, context: any): void;
    protected VisitQueryOptions(node: Token, context: any): void;
    protected VisitInlineCount(node: Token, context: any): void;
    protected VisitFilter(node: Token, context: any): void;
    protected VisitOrderBy(node: Token, context: any): void;
    protected VisitOrderByItem(node: Token, context: any): void;
    protected VisitSkip(node: Token, context: any): void;
    protected VisitTop(node: Token, context: any): void;
    protected VisitSelect(node: Token, context: any): void;
    protected VisitSelectItem(node: Token, context: any): void;
    protected VisitAndExpression(node: Token, context: any): void;
    protected VisitOrExpression(node: Token, context: any): void;
    protected VisitBoolParenExpression(node: Token, context: any): void;
    protected VisitCommonExpression(node: Token, context: any): void;
    protected VisitFirstMemberExpression(node: Token, context: any): void;
    protected VisitMemberExpression(node: Token, context: any): void;
    protected VisitPropertyPathExpression(node: Token, context: any): void;
    protected VisitSingleNavigationExpression(node: Token, context: any): void;
    protected VisitODataIdentifier(node: Token, context: any): void;
    protected VisitEqualsExpression(node: Token, context: any): void;
    protected VisitNotEqualsExpression(node: Token, context: any): void;
    protected VisitLesserThanExpression(node: Token, context: any): void;
    protected VisitLesserOrEqualsExpression(node: Token, context: any): void;
    protected VisitGreaterThanExpression(node: Token, context: any): void;
    protected VisitGreaterOrEqualsExpression(node: Token, context: any): void;
    protected VisitLiteral(node: Token, context: any): void;
    protected VisitMethodCallExpression(node: Token, context: any): void;
}
