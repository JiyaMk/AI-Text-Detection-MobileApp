from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib

# Load the pre-trained unigram models and vectorizer
nb_model_uni = joblib.load('uni model pkl/nb_model.pkl')
lr_model_uni = joblib.load('uni model pkl/lr_model.pkl')
uni_vectorizer = joblib.load('uni model pkl/uni-vectorizer.pkl')

# Load the pre-trained bigram models and vectorizer
rf_model_bi = joblib.load('bi model pkl/rf_model.pkl')
lgb_model_bi = joblib.load('bi model pkl/lgb_model.pkl')
bi_vectorizer = joblib.load('bi model pkl/bi-vectorizer.pkl')

app = Flask(__name__)
# allow cross-origin requests so mobile apps can call /predict
CORS(app)

# Route to serve the index.html page
@app.route('/')
def index():
    return render_template('index.html')

# Define a route for prediction
@app.route('/predict', methods=['POST'])
def predict():
    # Get the input data from the request
    data = request.json
    text = data.get('text', '')
    model_type = data.get('model', 'unigram')

    if not text:
        return jsonify({"error": "No text provided"}), 400

    def interpret(prob):
        """Return label (AI/Human) and a human-friendly confidence level for a probability (0..1)."""
        if prob is None:
            return {'label': 'Unknown', 'confidence': 'Unknown'}
        # label threshold is 0.5
        label = 'AI-generated' if prob > 0.5 else 'Human-written'
        # confidence categories (safe, informative -- do not change model logic)
        if prob >= 0.95:
            conf = 'Very high confidence'
        elif prob >= 0.9:
            conf = 'High confidence'
        elif prob >= 0.75:
            conf = 'Likely'
        elif prob >= 0.6:
            conf = 'Some evidence'
        elif prob >= 0.4:
            conf = 'Uncertain'
        elif prob >= 0.25:
            conf = 'Some evidence (human)'
        else:
            conf = 'Likely human'

        return {'label': label, 'confidence': conf}

    if model_type == 'unigram':
        # Transform the input text using the unigram vectorizer
        text_vector = uni_vectorizer.transform([text]).toarray()

        # Get predictions from the unigram models
        nb_probs = nb_model_uni.predict_proba(text_vector)[:, 1]
        lr_probs = lr_model_uni.predict_proba(text_vector)[:, 1]

        # Combine predictions (average)
        combined_probs_uni = (nb_probs + lr_probs) / 2
        combined_prediction_uni = (combined_probs_uni > 0.5).astype(int)

        response = {
            'nb_prediction_uni': int(nb_model_uni.predict(text_vector)[0]),
            'lr_prediction_uni': int(lr_model_uni.predict(text_vector)[0]),
            'combined_prediction_uni': int(combined_prediction_uni[0]),
            'nb_probs_uni': float(nb_probs[0]),
            'lr_probs_uni': float(lr_probs[0]),
            'combined_probs_uni': float(combined_probs_uni[0])
        }
        # add human friendly labels and confidence
        interp = interpret(response['combined_probs_uni'])
        response['combined_label_uni'] = interp['label']
        response['combined_confidence_uni'] = interp['confidence']

    elif model_type == 'bigram':
        # Transform the input text using the bigram vectorizer
        text_vector = bi_vectorizer.transform([text]).toarray()

        # Get predictions from the bigram models
        rf_probs = rf_model_bi.predict_proba(text_vector)[:, 1]
        lgb_probs = lgb_model_bi.predict_proba(text_vector)[:, 1]

        # Combine predictions (average)
        combined_probs_bi = (rf_probs + lgb_probs) / 2
        combined_prediction_bi = (combined_probs_bi > 0.5).astype(int)

        response = {
            'rf_prediction_bi': int(rf_model_bi.predict(text_vector)[0]),
            'lgb_prediction_bi': int(lgb_model_bi.predict(text_vector)[0]),
            'combined_prediction_bi': int(combined_prediction_bi[0]),
            'rf_probs_bi': float(rf_probs[0]),
            'lgb_probs_bi': float(lgb_probs[0]),
            'combined_probs_bi': float(combined_probs_bi[0])
        }
        # add human friendly labels and confidence
        interp = interpret(response['combined_probs_bi'])
        response['combined_label_bi'] = interp['label']
        response['combined_confidence_bi'] = interp['confidence']

    else:
        return jsonify({"error": "Invalid model type selected"}), 400

    return jsonify(response)

# Start the Flask app
if __name__ == '__main__':
    # Listen on all interfaces so mobile devices on the same network can connect
    app.run(host='0.0.0.0', port=5000, debug=True)
