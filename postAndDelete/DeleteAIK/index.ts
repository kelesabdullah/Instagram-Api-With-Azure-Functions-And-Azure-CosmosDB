import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { createConnection } from "mongoose";
const { SecretClient } = require("@azure/keyvault-secrets");
const { ClientSecretCredential } = require("@azure/identity");

const url = "your mongodb url";
let responseMessage: string;
let responseStatus: number;
let username: string;
let key: string;
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request.");
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
    const client = createConnection(url);
    const collection = client.collection("your collection name");
    const counter = await collection.countDocuments({ userUsername: username });
    if (counter != 0) {
      const toDelete = await collection.findOne({ userUsername: username });
      await collection.deleteMany(toDelete);
      client.close();
      responseMessage = "Succesfull";
      responseStatus = 200;
    } else {
      responseMessage = "Not valid input";
      responseStatus = 400;
    }
  } else {
    responseMessage = "Bad request";
    responseStatus = 400;
  }

  context.res = {
    status: responseStatus,
    body: responseMessage,
  };
};

export default httpTrigger;
