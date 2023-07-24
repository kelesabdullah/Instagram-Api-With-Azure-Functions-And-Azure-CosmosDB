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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const uuid_1 = require("uuid");
const { SecretClient } = require("@azure/keyvault-secrets");
const { ClientSecretCredential } = require("@azure/identity");
const axios = require("axios");
const url = "mongodb://azurecosmosdbforcase1:XrQbibze46FO3EVWMn3ub7o9KDfjhkNR3ZZP209dBLuma71L4naMFN7jqyivUvBOwgMJml2rIWnlACDb5VjXyw==@azurecosmosdbforcase1.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@azurecosmosdbforcase1@";
let responseMessage;
let responseStatus;
let username;
function initializeInformations(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = (0, mongoose_1.createConnection)(url);
        const options = {
            method: "GET",
            url: "https://instagram-bulk-profile-scrapper.p.rapidapi.com/clients/api/ig/ig_profile",
            params: {
                ig: name,
                response_type: "short",
                corsEnabled: "false",
            },
            headers: {
                "X-RapidAPI-Key": "f042515b85mshb7be9bd33219508p185ed8jsn405b92ca2e7f",
                "X-RapidAPI-Host": "instagram-bulk-profile-scrapper.p.rapidapi.com",
            },
        };
        const response = yield axios.request(options);
        try {
            const userpk = response.data[0].pk;
            const userUsername = response.data[0].username;
            const userFullname = response.data[0].full_name;
            const userBiography = response.data[0].biography;
            const userPhoto = response.data[0].hd_profile_pic_url_info.url;
            const user = {
                _id: (0, uuid_1.v4)(),
                userpk,
                userUsername,
                userFullname,
                userBiography,
                userPhoto,
            };
            const collection = client.collection("Instagram");
            yield collection.insertOne(user);
            yield client.close();
        }
        catch (error) {
            console.error(error);
        }
    });
}
const httpTrigger = function (context, req) {
    return __awaiter(this, void 0, void 0, function* () {
        context.log("Post Query Executed.");
        let key;
        username = req.body && req.body.username;
        key = req.body && req.body.key;
        const client = (0, mongoose_1.createConnection)(url);
        const secretCollection = client.collection("secrets");
        const get_tenant = yield secretCollection.findOne({ id: "1" });
        const tenant_id = get_tenant.value;
        const get_client = yield secretCollection.findOne({ id: "2" });
        const client_id = get_client.value;
        const get_secret = yield secretCollection.findOne({ id: "3" });
        const secret_id = get_secret.value;
        const keyVaultUri = `https://uemit-key1.vault.azure.net`;
        const credential = new ClientSecretCredential(tenant_id, client_id, secret_id);
        const secretClient = new SecretClient(keyVaultUri, credential);
        const mySecret = yield secretClient.getSecret("uemit-keyvalue");
        if (username && key && key === mySecret.value) {
            const collection = client.collection("Instagram");
            const counter = yield collection.countDocuments({
                userUsername: username,
            });
            if (counter >= 1) {
                responseMessage = "Data already exists";
                responseStatus = 400;
                client.close();
            }
            else {
                initializeInformations(username);
                responseMessage = "Succesfull";
                responseStatus = 200;
            }
            client.close();
        }
        else {
            responseMessage = "Bad request";
            responseStatus = 400;
            client.close();
        }
        context.res = {
            status: responseStatus,
            body: responseMessage,
        };
    });
};
exports.default = httpTrigger;
//# sourceMappingURL=index.js.map