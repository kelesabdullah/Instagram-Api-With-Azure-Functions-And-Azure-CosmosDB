import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { createConnection } from "mongoose";
import { v4 as uuid } from "uuid";
const { SecretClient } = require("@azure/keyvault-secrets");
const { ClientSecretCredential } = require("@azure/identity");

const axios = require("axios");

const url = "your mongodb url";

let responseMessage: string;
let responseStatus: number;
let username: string;
async function initializeInformations(name) {
  const client = createConnection(url);
  const options = {
    method: "GET",
    url: "https://instagram-bulk-profile-scrapper.p.rapidapi.com/clients/api/ig/ig_profile",
    params: {
      ig: name,
      response_type: "short",
      corsEnabled: "false",
    },
    headers: {
      "X-RapidAPI-Key": "your rapid api key",
      "X-RapidAPI-Host": "instagram-bulk-profile-scrapper.p.rapidapi.com",
    },
  };
  const response = await axios.request(options);
  try {
    const userpk = response.data[0].pk;
    const userUsername = response.data[0].username;
    const userFullname = response.data[0].full_name;
    const userBiography = response.data[0].biography;
    const userPhoto = response.data[0].hd_profile_pic_url_info.url;

    const user = {
      _id: uuid(),
      userpk,
      userUsername,
      userFullname,
      userBiography,
      userPhoto,
    };
    const collection = client.collection("your collection name");
    await collection.insertOne(user);
    await client.close();
  } catch (error) {
    console.error(error);
  }
}

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("Post Query Executed.");
  let key: string;
  username = req.body && req.body.username;
  key = req.body && req.body.key;
  const client = createConnection(url);
  const secretCollection = client.collection("secrets");
  const get_tenant = await secretCollection.findOne({ id: "1" });
  const tenant_id = get_tenant.value;
  const get_client = await secretCollection.findOne({ id: "2" });
  const client_id = get_client.value;
  const get_secret = await secretCollection.findOne({ id: "3" });
  const secret_id = get_secret.value;
  const keyVaultUri = `your key vault uri`;
  const credential = new ClientSecretCredential(
    tenant_id,
    client_id,
    secret_id
  );
  const secretClient = new SecretClient(keyVaultUri, credential);
  const mySecret = await secretClient.getSecret("your secret name");
  if (username && key && key === mySecret.value) {
    const collection = client.collection("Instagram");
    const counter = await collection.countDocuments({
      userUsername: username,
    });
    if (counter >= 1) {
      responseMessage = "Data already exists";
      responseStatus = 400;
      client.close();
    } else {
      initializeInformations(username);
      responseMessage = "Succesfull";
      responseStatus = 200;
    }
    client.close();
  } else {
    responseMessage = "Bad request";
    responseStatus = 400;
    client.close();
  }

  context.res = {
    status: responseStatus,
    body: responseMessage,
  };
};

export default httpTrigger;
