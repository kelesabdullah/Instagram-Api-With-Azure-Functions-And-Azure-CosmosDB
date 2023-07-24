import azure.functions as func
import logging
from pymongo import MongoClient
import json
url = "your mongo db url"

client = MongoClient(url)
cosmos_database_name = "your cosmos db name"
cosmos_collection_name = "your cosmos db collection name"

my_db = client[cosmos_database_name]
my_col = my_db[cosmos_collection_name]
my_docs = my_col.find({})
temp_list = list()

for doc in my_docs:
    temp_list.append(doc)

json_obj = json.dumps(temp_list)
json_loads = json.loads(json_obj)

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)


@app.route(route="GetAIKdata", auth_level=func.AuthLevel.FUNCTION)
def GetAIKdata(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    try:
        name = req.get_json().get('name')

        if name:
            responseMessage = 'Not Valid Input'
            print(json_loads)
            print(len(json_loads))
            for x in json_loads:
                if name == x['userUsername']:
                    return func.HttpResponse(json.dumps(x), status_code=200)
            return func.HttpResponse(responseMessage, status_code=400)
        elif name == "":
            return func.HttpResponse(json_obj, status_code=200)

        else:
            return func.HttpResponse(
                "Get function Executed but input is not valid",
                status_code=400
            )

    except:
        return func.HttpResponse(json_obj, status_code=200)
