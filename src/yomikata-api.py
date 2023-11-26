import re
from flask_cors import CORS, cross_origin
from yomikata.dbert import dBert
from yomikata.dictionary import Dictionary
from flask import Flask, request

# flask --app yomikata-api run --debug

reader = dBert()
dictreader = Dictionary()

# flask endpoint
app = Flask(__name__)
cors = CORS(app)
app.config["CORS_HEADERS"] = "Content-Type"


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
