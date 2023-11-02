from yomikata.dbert import dBert
from yomikata.dictionary import Dictionary
from flask import Flask, request

reader = dBert()
dictreader = Dictionary()

# flask endpoint
app = Flask(__name__)

@app.route('/disambiguate', methods=['POST'])
def disambiguate():
    return reader.furigana(request.json.get('text'))

@app.route('/all-furigana', methods=['POST'])
def furigana():
    return dictreader.furigana(reader.furigana(request.json.get('text')))
