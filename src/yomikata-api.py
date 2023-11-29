import json
from bson.objectid import ObjectId
from flask_cors import CORS
from flask import Flask, request
from pymongo.mongo_client import MongoClient

# flask --app yomikata-api run --debug
# gunicorn -w 4 -b 0.0.0.0 'yomikata-api:app'

uri = "mongodb+srv://samuel:CIbpAoqojkPxVT8r@cluster0.xaatb2a.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(uri)
db = client["tsuuji"]
users = db["users"]

# flask endpoint
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, origins="*", send_wildcard=True)
app.config["CORS_HEADERS"] = "Content-Type"


@app.route("/")
def hello():
    return "hi"


@app.route("/create-user", methods=["POST"])
def create_user():
    user = users.insert_one({"messages": [], "furiganaMessages": []})
    return str(user.inserted_id)


@app.route("/create-user-id", methods=["POST"])
def create_user_id():
    user = users.insert_one(
        {
            "_id": ObjectId(request.json.get("user")),
            "messages": [],
        }
    )
    return str(user.inserted_id)


@app.route("/get-user", methods=["POST"])
def get_user():
    res = users.find_one({"_id": ObjectId(request.json.get("user"))})
    res["_id"] = str(res["_id"])
    return json.dumps(res)


@app.route("/add-message", methods=["POST"])
def add_message():
    users.update_one(
        {"_id": ObjectId(request.json.get("user"))},
        {"$push": {"messages": request.json.get("message")}},
    )
    return "ok"


@app.route("/clear-messages", methods=["POST"])
def clear_messages():
    users.update_one(
        {"_id": ObjectId(request.json.get("user"))},
        {"$set": {"messages": []}},
    )
    return "ok"
