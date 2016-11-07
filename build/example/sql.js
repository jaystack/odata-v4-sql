"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
const sql = require("mssql");
const config = require("config");
const index_1 = require("../lib/index");
const odata_v4_server_1 = require("odata-v4-server");
let db = config.get("sqlConfig");
class UsersController extends odata_v4_server_1.ODataController {
    *getUsers(stream, query) {
        console.log("Connecting to SQL server...");
        let connection = new sql.Connection(db);
        yield connection.connect();
        console.log("Connection OK!");
        let request = new sql.Request(connection);
        let output = request.pipe(stream);
        let sqlQuery = index_1.createQuery(query, {
            useParameters: true,
            type: index_1.SQLLang.MsSql
        });
        sqlQuery.parameters.forEach((value, name) => request.input(name, value));
        request.query(sqlQuery.from("Users"));
        return output;
    }
    *getUser(id, stream, query) {
        console.log("Connecting to SQL server...");
        let connection = new sql.Connection(db);
        yield connection.connect();
        console.log("Connection OK!");
        let request = new sql.Request(connection);
        let sqlQuery = index_1.createQuery(query, { useParameters: true, type: index_1.SQLLang.MsSql });
        sqlQuery.parameters.forEach((value, name) => request.input(name, value));
        request.input("id", id);
        let result = yield request.query(`SELECT ${sqlQuery.select} FROM Users WHERE Id = @id AND (${sqlQuery.where})`);
        return result[0];
    }
}
__decorate([
    odata_v4_server_1.odata.GET,
    __param(0, odata_v4_server_1.odata.stream),
    __param(1, odata_v4_server_1.odata.query)
], UsersController.prototype, "getUsers", null);
__decorate([
    odata_v4_server_1.odata.GET,
    __param(0, odata_v4_server_1.odata.key),
    __param(1, odata_v4_server_1.odata.stream),
    __param(2, odata_v4_server_1.odata.query)
], UsersController.prototype, "getUser", null);
class UserProfilesController extends odata_v4_server_1.ODataController {
    *getUserProfiles(stream, query) {
        console.log("Connecting to SQL server...");
        let connection = new sql.Connection(db);
        yield connection.connect();
        console.log("Connection OK!");
        let request = new sql.Request(connection);
        let output = request.pipe(stream);
        let sqlQuery = index_1.createQuery(query, { useParameters: true, type: index_1.SQLLang.MsSql });
        sqlQuery.parameters.forEach((value, name) => request.input(name, value));
        request.query(sqlQuery.from("UserProfiles"));
        return output;
    }
    *getUserProfile(id, stream, query) {
        console.log("Connecting to SQL server...");
        let connection = new sql.Connection(db);
        yield connection.connect();
        console.log("Connection OK!");
        let request = new sql.Request(connection);
        let sqlQuery = index_1.createQuery(query, { useParameters: true, type: index_1.SQLLang.MsSql });
        sqlQuery.parameters.forEach((value, name) => request.input(name, value));
        request.input("id", id);
        let result = yield request.query(`SELECT ${sqlQuery.select} FROM UserProfiles WHERE Id = @id AND (${sqlQuery.where})`);
        return result[0];
    }
}
__decorate([
    odata_v4_server_1.odata.GET,
    __param(0, odata_v4_server_1.odata.stream),
    __param(1, odata_v4_server_1.odata.query)
], UserProfilesController.prototype, "getUserProfiles", null);
__decorate([
    odata_v4_server_1.odata.GET,
    __param(0, odata_v4_server_1.odata.key),
    __param(1, odata_v4_server_1.odata.stream),
    __param(2, odata_v4_server_1.odata.query)
], UserProfilesController.prototype, "getUserProfile", null);
let SqlServer = class SqlServer extends odata_v4_server_1.ODataServer {
};
SqlServer = __decorate([
    odata_v4_server_1.odata.controller(UsersController, true),
    odata_v4_server_1.odata.controller(UserProfilesController, true)
], SqlServer);
SqlServer.create("/odata", 3003);
//# sourceMappingURL=sql.js.map