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
    res = dictreader.furigana(reader.furigana(request.json.get('text')))
    # convert to html
    # {} are converted to <ruby></ruby>
    # element to the left of / is put inside <rb></rb>, element to the right is put inside <rt></rt>
    return res
