/*
  * Copyright (c) 2024 Inimi | InimicalPart | Incoverse
  *
  * This program is free software: you can redistribute it and/or modify
  * it under the terms of the GNU General Public License as published by
  * the Free Software Foundation, either version 3 of the License, or
  * (at your option) any later version.
  *
  * This program is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  * GNU General Public License for more details.
  *
  * You should have received a copy of the GNU General Public License
  * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { IRISGlobal } from "@src/interfaces/global.js"
import { MongoClient } from "mongodb"
import { fileURLToPath } from 'url';
import mingo, { Query } from "mingo";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import crypto from "crypto";
import { updateObject } from "mingo/updater";

const __filename = fileURLToPath(import.meta.url);

declare const global: IRISGlobal

var method: string = "file"
var connectionClient: MongoClient = null

export const returnFileName = () =>
    __filename.split(process.platform == "linux" ? "/" : "\\")[
      __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
];

export async function checkMongoAvailability() {
    let client = null;
    try {
        client = new MongoClient(global.mongoConnectionString)
        await client.connect()
        const result = await client.db("admin").command({ ping: 1 })
        const res = result.ok === 1
        if (res) {
            connectionClient = client
            method = "mongo"
        } else method = "file"
        return res
    } catch (error) {
        global.logger.debugError("No MongoDB availability. Reason: " + error.toString(), returnFileName())
        method = "file"
        if (client) client.close()
        return false
    }
}

export async function setupFiles() {
    const shouldExist = []
    if (global.app.config.development) {
        shouldExist.push("development/userdata_" + global.app.config.mainServer + ".json")
        shouldExist.push("development/serverdata_" + global.app.config.mainServer + ".json")
        shouldExist.push("development/offensedata_" + global.app.config.mainServer + ".json")
    } else {
        shouldExist.push("production/userdata.json")
        shouldExist.push("production/serverdata.json")
        shouldExist.push("production/offensedata.json")
    }

    for (const file of shouldExist) {
        let filePath = path.join(process.cwd(), global.app.config.backupStoragePath, file)
        if (!fs.existsSync(filePath)) {
            let dir = path.dirname(filePath)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
            fs.writeFileSync(filePath, "[]")
            global.logger.debug("Created file: " + chalk.yellowBright(file), returnFileName())
        }
    }
}


export async function deleteOne(dataType:"user"|"server"|"offense", filter: object) {
    return await del(dataType, filter, "one")
}

export async function deleteMany(dataType:"user"|"server"|"offense", filter: object) {
    return await del(dataType, filter, "many")
}

// This should update the database with the new data, where it saves is changed by "method"
async function del(dataType:"user"|"server"|"offense", filter: object, oneOrMany: "one" | "many" = "one") {
    let collection;
    let filePathRelative; // from defined container folder (relative)
    switch (dataType) {
        case "user":
            collection = global.app.config.development ? "DEVSRV_UD_" + global.app.config.mainServer : "userdata"
            filePathRelative = global.app.config.development ? "development/userdata_" + global.app.config.mainServer + ".json" : "production/userdata.json"
            break
        case "server":
            collection = global.app.config.development ? "DEVSRV_SD_" + global.app.config.mainServer : "serverdata"
            filePathRelative = global.app.config.development ? "development/serverdata_" + global.app.config.mainServer + ".json" : "production/serverdata.json"
            break
        case "offense":
            collection = global.app.config.development ? "DEVSRV_OD_" + global.app.config.mainServer : "offensedata"
            filePathRelative = global.app.config.development ? "development/offensedata_" + global.app.config.mainServer + ".json" : "production/offensedata.json"
            break
        default:
            global.logger.debugError("Invalid data type: " + dataType, returnFileName())
            return false
    }

    if (method == "mongo") {
        try {
            const col = connectionClient.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS").collection(collection)
            return oneOrMany == "one" ? await col.deleteOne(filter) : await col.deleteMany(filter)
        } catch (error) {
            global.logger.error(error.toString(), returnFileName())
            return false
        }
    } else {
        let filePath = path.join(process.cwd(), global.app.config.backupStoragePath, filePathRelative)

        try {
            let data = JSON.parse(fs.readFileSync(filePath, "utf-8")) ?? []
            let query = new Query(filter as any)
            let toBeDeleted = oneOrMany == "one" ? data.find((doc) => query.test(doc)) : data.filter((doc) => query.test(doc))
            
            if (oneOrMany == "one") {
                data = data.filter((doc) => doc._id != toBeDeleted._id)
            } else {
                data = data.filter((doc) => !query.test(doc))
            }
            fs.writeFileSync(filePath, JSON.stringify(data))
            return toBeDeleted
        } catch (error) {
            global.logger.error(error.toString(), returnFileName())
            return false
        }
    }
}


export async function findOne(dataType:"user"|"server"|"offense", filter: object) {
    return await get(dataType, filter, "one")
}

export async function find(dataType:"user"|"server"|"offense", filter: object) {
    return await get(dataType, filter, "many")
}



async function get(dataType:"user"|"server"|"offense", filter: object, oneOrMany: "one" | "many" = "one") {
    let collection;
    let filePathRelative; // from defined container folder (relative)
    switch (dataType) {
        case "user":
            collection = global.app.config.development ? "DEVSRV_UD_" + global.app.config.mainServer : "userdata"
            filePathRelative = global.app.config.development ? "development/userdata_" + global.app.config.mainServer + ".json" : "production/userdata.json"
            break
        case "server":
            collection = global.app.config.development ? "DEVSRV_SD_" + global.app.config.mainServer : "serverdata"
            filePathRelative = global.app.config.development ? "development/serverdata_" + global.app.config.mainServer + ".json" : "production/serverdata.json"
            break
        case "offense":
            collection = global.app.config.development ? "DEVSRV_OD_" + global.app.config.mainServer : "offensedata"
            filePathRelative = global.app.config.development ? "development/offensedata_" + global.app.config.mainServer + ".json" : "production/offensedata.json"
            break
        default:
            global.logger.debugError("Invalid data type: " + dataType, returnFileName())
            return null
    }

    if (method == "mongo") {
        try {
            const col = connectionClient.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS").collection(collection)
            return oneOrMany == "one" ? await col.findOne(filter) : await col.find(filter).toArray()
        } catch (error) {
            global.logger.error(error.toString(), returnFileName())
            return null
        }
    } else {
        let filePath = path.join(process.cwd(), global.app.config.backupStoragePath, filePathRelative)

        try {
            let data = JSON.parse(fs.readFileSync(filePath, "utf-8")) ?? []
            let query = new Query(filter as any)
            return oneOrMany == "one" ? data.find((doc) => query.test(doc)) : data.filter((doc) => query.test(doc))
        } catch (error) {
            global.logger.error(error.toString(), returnFileName())
            return null
        }
    }
}


export async function insertOne(dataType:"user"|"server"|"offense", data: { [key: string]: any }) {
    return await add(dataType, data, "one")
}

export async function insertMany(dataType:"user"|"server"|"offense", data: Array<{ [key: string]: any }>) {
    return await add(dataType, data, "many")
}

async function add(dataType:"user"|"server"|"offense", data: { [key: string]: any } | Array<{ [key: string]: any }>, oneOrMany: "one" | "many" = "one") {
    let collection;
    let filePathRelative; // from defined container folder (relative)
    switch (dataType) {
        case "user":
            collection = global.app.config.development ? "DEVSRV_UD_" + global.app.config.mainServer : "userdata"
            filePathRelative = global.app.config.development ? "development/userdata_" + global.app.config.mainServer + ".json" : "production/userdata.json"
            break
        case "server":
            collection = global.app.config.development ? "DEVSRV_SD_" + global.app.config.mainServer : "serverdata"
            filePathRelative = global.app.config.development ? "development/serverdata_" + global.app.config.mainServer + ".json" : "production/serverdata.json"
            break
        case "offense":
            collection = global.app.config.development ? "DEVSRV_OD_" + global.app.config.mainServer : "offensedata"
            filePathRelative = global.app.config.development ? "development/offensedata_" + global.app.config.mainServer + ".json" : "production/offensedata.json"
            break
        default:
            global.logger.debugError("Invalid data type: " + dataType, returnFileName())
            return false
    }

    if (method == "mongo") {
        try {
            const col = connectionClient.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS").collection(collection)
            return oneOrMany == "one" ? await col.insertOne(data as { [key: string]: any }) : await col.insertMany(data as Array<{ [key: string]: any }>)
        } catch (error) {
            global.logger.error(error.toString(), returnFileName())
            return false
        }
    } else {
        let filePath = path.join(process.cwd(), global.app.config.backupStoragePath, filePathRelative)
        try {
            let alreadyExistingData = JSON.parse(fs.readFileSync(filePath, "utf-8")) ?? []
            let newData = []

            if (oneOrMany == "one") {
                (data as { [key: string]: any })._id = crypto.randomBytes(16).toString("hex")
                while (alreadyExistingData.some((d) => d._id == (data as { [key: string]: any })._id)) {
                    (data as { [key: string]: any })._id = crypto.randomBytes(16).toString("hex")
                }
                newData = [...alreadyExistingData, data]
            } else  {

                (data as Array<{ [key: string]: any }>).forEach((doc) => {
                    doc._id = crypto.randomBytes(16).toString("hex")
                    while (alreadyExistingData.some((d) => d._id == doc._id)) {
                        doc._id = crypto.randomBytes(16).toString("hex")
                    }
                })
                newData = [...alreadyExistingData, ...(data as Array<{ [key: string]: any }>)]

            }
            fs.writeFileSync(filePath, JSON.stringify(newData))
            return data
        } catch (error) {
            global.logger.error(error.toString(), returnFileName())
            return false
        }
    }

}

export async function updateOne(dataType:"user"|"server"|"offense", filter: object, data: object) {
    return await update(dataType, filter, data, "one")
}

export async function updateMany(dataType:"user"|"server"|"offense", filter: object, data: object) {
    return await update(dataType, filter, data, "many")
}

async function update(dataType:"user"|"server"|"offense", filter: object, data: object, oneOrMany: "one" | "many" = "one") {
    let collection;
    let filePathRelative; // from defined container folder (relative)
    switch (dataType) {
        case "user":
            collection = global.app.config.development ? "DEVSRV_UD_" + global.app.config.mainServer : "userdata"
            filePathRelative = global.app.config.development ? "development/userdata_" + global.app.config.mainServer + ".json" : "production/userdata.json"
            break
        case "server":
            collection = global.app.config.development ? "DEVSRV_SD_" + global.app.config.mainServer : "serverdata"
            filePathRelative = global.app.config.development ? "development/serverdata_" + global.app.config.mainServer + ".json" : "production/serverdata.json"
            break
        case "offense":
            collection = global.app.config.development ? "DEVSRV_OD_" + global.app.config.mainServer : "offensedata"
            filePathRelative = global.app.config.development ? "development/offensedata_" + global.app.config.mainServer + ".json" : "production/offensedata.json"
            break
        default:
            global.logger.debugError("Invalid data type: " + dataType, returnFileName())
            return false
    }

    if (method == "mongo") {
        try {
            const col = connectionClient.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS").collection(collection)
            return oneOrMany == "one" ? await col.updateOne(filter, data) : await col.updateMany(filter, data)
        } catch (error) {
            global.logger.error(error.toString(), returnFileName())
            return false
        }
    } else {
        let filePath = path.join(process.cwd(), global.app.config.backupStoragePath, filePathRelative)

        try {
            let alreadyExistingData = JSON.parse(fs.readFileSync(filePath, "utf-8")) ?? []
            let query = new Query(filter as any)
            
            if (oneOrMany == "one") {
                let toUpdate = alreadyExistingData.find((doc) => query.test(doc))
                if (!toUpdate) return false
                delete (data as any)._id
                updateObject(toUpdate, data as any)
                alreadyExistingData.map((doc) => doc._id == toUpdate._id ? toUpdate : doc)
            } else {
                let toUpdate = alreadyExistingData.filter((doc) => query.test(doc))
                if (!toUpdate) return false
                delete (data as any)._id
                toUpdate.map((doc) => {updateObject(doc, data as any); return doc})
                alreadyExistingData.map((doc) => toUpdate.some((d) => d._id == doc._id) ? toUpdate.find((d) => d._id == doc._id) : doc)
            }

            fs.writeFileSync(filePath, JSON.stringify(alreadyExistingData))
            return true
        } catch (error) {
            global.logger.error(error.toString(), returnFileName())
            return false
        }
    }
}

export async function setupMongo() {
    if (method == "file") return false

    const requiredCollections = [
        global.app.config.development ? "DEVSRV_UD_" + global.app.config.mainServer : "userdata",
        global.app.config.development ? "DEVSRV_SD_" + global.app.config.mainServer : "serverdata",
        global.app.config.development ? "DEVSRV_OD_" + global.app.config.mainServer : "offensedata",
    ]

    try {
        const database = connectionClient.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS");
        const collections = (await database.listCollections().toArray()).map((c) => c.name);
        for (const collection of requiredCollections) {
            if (!collections.includes(collection)) {
                await database.createCollection(collection)
                global.logger.debug(`Successfully created a missing collection in the database: ${chalk.yellow(global.app.config.development ? "DEVSRV_OD_"+global.app.config.mainServer : "offensedata")}`,returnFileName());
            }
        }
    } catch (error) {
        global.logger.error(error.toString(), returnFileName())
        return false
    }
    
}

export async function cleanup() {
    if (connectionClient) await connectionClient.close().then(() => global.logger.debug("Closed MongoDB connection.", returnFileName()))
}


export default {
    get method() : string {
        return method //! This is so that you can read the value of method outside of this file, but can't change it
    },
    findOne,
    find,
    deleteOne,
    deleteMany,
    insertOne,
    insertMany,
    updateOne,
    updateMany,
    cleanup,
    checkMongoAvailability,
}

  