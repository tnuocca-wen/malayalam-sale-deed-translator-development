from flask import Flask, render_template, request, send_file, jsonify
from ocr import pdf2images, mal_ocr
import joblib
from format import split_into_sentences_custom
from gpt4 import chatGPT_Trans

import threading

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


# lines = []
# comp_sentences = []
pdf_path = None
fname = None
pdf_file = None
# senti = session.get('sentences', '')
senti = ''
sentences = []
cancel_task = None
ocr_done = False

@app.context_processor
def inject_pdf_path():
    def pdf_path_get():
        global pdf_path
        return pdf_path
    return dict(pdf_path=pdf_path_get)

# @app.route('/getocr', methods=['GET'])
# def get_ocr():
#     convert_pdf()
#     global sentences
#     senti = ''
#     for sent in sentences:
#         senti += sent
#     return jsonify({"ocr_text": senti})

@app.route('/cancel_task', methods=['POST'])
def cancel():
    global cancel_task
    cancel_task = True
    return jsonify({'status': 'canceled', 'message': 'Task canceled'})

@app.route('/file_upload', methods=['POST'])
def upload():
    global pdf_path, pdf_file, fname
    pdf_file = request.files['pdf_file']

    pdf_file.save(f"static/documents/{pdf_file.filename}")
    pdf_path = f"static/documents/{pdf_file.filename}"
    fname = pdf_file.filename.rsplit('.', 1)[0]

    return jsonify({'status': 'success', 'message': 'File uploaded successfully', 'pdf_path':pdf_path})

@app.route('/doc_ocr', methods=['POST'])
def start_ocr():
    global cancel_task, senti, pdf_path, sentences
    cancel_task = False
    ocr_thread = threading.Thread(target=convert_pdf)
    ocr_thread.daemon = True
    ocr_thread.start()
    ocr_thread.join()
    if ocr_done == True and cancel_task == False:
        return jsonify({'status': 'success', 'message': 'OCR done successfully','sentences':senti, 'sentences_list':sentences, 'pdf_path':pdf_path})
    elif ocr_done == True and cancel_task == True:
        return jsonify({'status': 'success', 'message': 'OCR done partially','sentences':senti, 'pdf_path':pdf_path})
    else:
        return jsonify({'status': 'error', 'message': 'Invalid pdf File'})



def convert_pdf():
    global pdf_path, senti, fname, pdf_file, ocr_done, sentences
    senti = ''
    # with open(pdf_file.filename, 'ren') as pdfn_file:
    #     print(pdfn_file)
    if pdf_file and pdf_file.filename.endswith('.pdf'):
        pages = pdf2images(pdf_file)

        lines = []
        ocr_textls = []
        lnes = []
        for img in pages:  # if using PyMuPdf use 'images' instead of 'image_files_sorted'
            if cancel_task:
                print('breaked')
                break
            ocr_textls.append(mal_ocr(img))
        for line in ocr_textls:
            lines.append(line.split('\n'))
        for lst in lines:
            for line in lst:
                lnes.append(line)
        del lines
        lines = lnes
        del lnes

        comp_sentences = []

        loaded_model = joblib.load('random_forest_model.joblib')
        new_lines = lines

        def extract_features(line):
            char_count = len(line)
            ends_with_full_stop = line.endswith('.')
            # Count Malayalam characters
            malayalam_chars = sum(
                1 for char in line if '\u0D00' <= char <= '\u0D7F')

            return [char_count, int(ends_with_full_stop), malayalam_chars]

        # Extract features for the new lines
        new_data = [extract_features(line) for line in new_lines]

        # Make predictions using the loaded model
        predictions = loaded_model.predict(new_data)

        # Print the predictions for each line
        for line, prediction in zip(new_lines, predictions):
            if prediction:
                # print(f"{line}")
                comp_sentences.append(line)

            else:
                pass  # print(f"'{line}' is not relevant.")

        single_string = " ".join(comp_sentences)
        input_text = single_string

        # Split the text into sentences
        sentences = split_into_sentences_custom(input_text)

        # Print the resulting sentences
        for i, sentence in enumerate(sentences):
            senti += sentence + '\n`~>\n\n'
            print(f"Sentence {i+1}: {sentence}")
        ocr_done = True
        return

      
def translate():
    global sentences
    translated = []
    for sent in sentences:
        print(sent)
        clnd = chatGPT_Trans(sent)
        translated.append(clnd)
        print(clnd)

    with open('output.txt', 'w', encoding='utf-8') as text_file:
        text_file.write("\n".join(translated))

    return send_file('output.txt', as_attachment=True, download_name=f'{fname}.txt')

# loc_path = None
# @app.route('/display')
# def display_pdf():
#     global pdf_path, loc_path
#     if pdf_path:
#         loc_path = pdf_path
#         pdf_path = None
#     else:
#         pdf_path = loc_path
#     return render_template('index.html')


if __name__ == '__main__':
    # import threading
    # ocr_thread = threading.Thread(target=convert_pdf)
    # ocr_thread.daemon = True
    # ocr_thread.start()

    app.run(debug=True)
