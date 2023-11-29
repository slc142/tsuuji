import re
import json
from bson.objectid import ObjectId
from flask_cors import CORS
from yomikata.dbert import dBert
from yomikata.dictionary import Dictionary
from flask import Flask, request
from pymongo.mongo_client import MongoClient

# flask --app yomikata-api run --debug
# gunicorn -w 4 -b 0.0.0.0 'yomikata-api:app'

uri = "mongodb+srv://samuel:CIbpAoqojkPxVT8r@cluster0.xaatb2a.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(uri)
db = client["tsuuji"]
users = db["users"]

reader = dBert()
dictreader = Dictionary()

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
            "furiganaMessages": [],
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


@app.route("/add-furigana-message", methods=["POST"])
def add_furigana_message():
    users.update_one(
        {"_id": ObjectId(request.json.get("user"))},
        {"$push": {"furiganaMessages": request.json.get("message")}},
    )
    return "ok"


@app.route("/clear-messages", methods=["POST"])
def clear_messages():
    users.update_one(
        {"_id": ObjectId(request.json.get("user"))},
        {"$set": {"messages": []}},
    )
    return "ok"


@app.route("/clear-furigana-messages", methods=["POST"])
def clear_furigana_messages():
    users.update_one(
        {"_id": ObjectId(request.json.get("user"))},
        {"$set": {"furiganaMessages": []}},
    )
    return "ok"


def convert_to_ruby(input_text):
    # Define the regular expression pattern
    pattern = r"{([^/]+)/([^}]+)}"

    # Define the replacement pattern
    replacement = r"<ruby><rb>\1</rb><rt>\2</rt></ruby>"

    # Use re.sub() to replace the matched pattern with the replacement
    output_text = re.sub(pattern, replacement, input_text)

    return output_text


@app.route("/disambiguate", methods=["POST"])
def disambiguate():
    return reader.furigana(request.json.get("text"))


# curl -H "Content-Type: application/json" -d '{"text":"そして、畳の表は、すでに幾年前に換えられたのか分ら なかった。"}' http://127.0.0.1:5000/all-furigana
@app.route("/all-furigana", methods=["POST"])
def furigana():
    res = dictreader.furigana(reader.furigana(request.json.get("text")))
    # convert to html
    # {} are converted to <ruby></ruby>
    # element to the left of / is put inside <rb></rb>, element to the right is put inside <rt></rt>
    res = convert_to_ruby(res)
    return res
