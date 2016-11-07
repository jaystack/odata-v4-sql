import * as sql from "mssql";
import * as config from "config";
import { createFilter, createQuery, SQLLang } from "../lib/index";
import { Edm, odata, ODataController, ODataServer, ODataQuery, ODataErrorHandler, ResourceNotFoundError, createODataServer } from "odata-v4-server";

let db:sql.config = <sql.config>config.get<sql.config>("sqlConfig");

class UsersController extends ODataController{
    @odata.GET
    *getUsers(@odata.stream stream, @odata.query query):any{
        console.log("Connecting to SQL server...");
        let connection:sql.Connection = new sql.Connection(db);
        yield connection.connect();
        console.log("Connection OK!");
        let request = new sql.Request(connection);
        let output = request.pipe(stream);

        let sqlQuery = createQuery(query, {
            useParameters: true,
            type: SQLLang.MsSql
        });
        sqlQuery.parameters.forEach((value, name) => request.input(name, value));

        request.query(sqlQuery.from("Users"));
        return output;
    }

    @odata.GET
    *getUser(@odata.key id:number, @odata.stream stream, @odata.query query):any{
        console.log("Connecting to SQL server...");
        let connection:sql.Connection = new sql.Connection(db);
        yield connection.connect();
        console.log("Connection OK!");
        let request = new sql.Request(connection);

        let sqlQuery = createQuery(query, { useParameters: true, type: SQLLang.MsSql });
        sqlQuery.parameters.forEach((value, name) => request.input(name, value));
        request.input("id", id);

        let result = yield request.query(`SELECT ${sqlQuery.select} FROM Users WHERE Id = @id AND (${sqlQuery.where})`);
        return result[0];
    }
}

class UserProfilesController extends ODataController{
    @odata.GET
    *getUserProfiles(@odata.stream stream, @odata.query query):any{
        console.log("Connecting to SQL server...");
        let connection:sql.Connection = new sql.Connection(db);
        yield connection.connect();
        console.log("Connection OK!");
        let request = new sql.Request(connection);
        let output = request.pipe(stream);

        let sqlQuery = createQuery(query, { useParameters: true, type: SQLLang.MsSql });
        sqlQuery.parameters.forEach((value, name) => request.input(name, value));

        request.query(sqlQuery.from("UserProfiles"));
        return output;
    }

    @odata.GET
    *getUserProfile(@odata.key id:number, @odata.stream stream, @odata.query query):any{
        console.log("Connecting to SQL server...");
        let connection:sql.Connection = new sql.Connection(db);
        yield connection.connect();
        console.log("Connection OK!");
        let request = new sql.Request(connection);

        let sqlQuery = createQuery(query, { useParameters: true, type: SQLLang.MsSql });
        sqlQuery.parameters.forEach((value, name) => request.input(name, value));
        request.input("id", id);

        let result = yield request.query(`SELECT ${sqlQuery.select} FROM UserProfiles WHERE Id = @id AND (${sqlQuery.where})`);
        return result[0];
    }
}

@odata.controller(UsersController, true)
@odata.controller(UserProfilesController, true)
class SqlServer extends ODataServer{}
SqlServer.create("/odata", 3003);