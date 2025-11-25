import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

// Change this to your backend base URL (dev: use ngrok or local IP; emulator: 10.0.2.2:5000 for Android emulator)
const API_BASE = 'http://192.168.29.9:5000';

export default function HomeScreen() {
  const [model, setModel] = useState<'unigram' | 'bigram'>('unigram');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!text.trim()) {
      setError('Please enter some text.');
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const resp = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, text }),
      });

      const json = await resp.json();
      if (!resp.ok) {
        setError(json.error || 'Server error');
      } else {
        if (model === 'unigram') {
          setResult({ model: 'unigram', nb: json.nb_probs_uni, lr: json.lr_probs_uni, combined: json.combined_probs_uni, label: json.combined_label_uni, confidence: json.combined_confidence_uni } as any);
        } else {
          setResult({ model: 'bigram', rf: json.rf_probs_bi, lgb: json.lgb_probs_bi, combined: json.combined_probs_bi, label: json.combined_label_bi, confidence: json.combined_confidence_bi } as any);
        }
      }
    } catch (err: any) {
      setError('Network error: ' + (err?.message ?? err));
    }

    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>AI Text Detector</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.option, model === 'unigram' && styles.optionSelected]} onPress={() => setModel('unigram')}>
          <Text style={styles.optionText}>Unigram</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.option, model === 'bigram' && styles.optionSelected]} onPress={() => setModel('bigram')}>
          <Text style={styles.optionText}>Bigram</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        multiline
        value={text}
        onChangeText={setText}
        placeholder={`Type or paste text here\n(Select a model: ${model})`}
        placeholderTextColor="#333"
        style={styles.textarea}
      />

      <View style={styles.middle}>
        <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.outputBox}>
        {loading && <Text style={styles.overlayText}>Detecting...</Text>}
        {!loading && result && (
          <View style={{paddingHorizontal:12}}>
            {result.model === 'unigram' ? (
              <>
                <Text style={styles.overlayText}>Naive Bayes: {result.nb !== undefined ? (result.nb*100).toFixed(2) + '%' : 'N/A'}</Text>
                <Text style={styles.overlayText}>Logistic Regression: {result.lr !== undefined ? (result.lr*100).toFixed(2) + '%' : 'N/A'}</Text>
              </>
            ) : (
              <>
                <Text style={styles.overlayText}>Random Forest: {result.rf !== undefined ? (result.rf*100).toFixed(2) + '%' : 'N/A'}</Text>
                <Text style={styles.overlayText}>LightGBM: {result.lgb !== undefined ? (result.lgb*100).toFixed(2) + '%' : 'N/A'}</Text>
              </>
            )}
            <Text style={[styles.overlayText, {marginTop:8, fontWeight:'700'}]}>Combined: {result.combined !== null ? (result.combined*100).toFixed(2) + '%' : 'No score'}</Text>
            <Text style={styles.overlayText}>Label: {result.label || 'N/A'}</Text>
            <Text style={styles.overlayText}>Confidence: {result.confidence || 'N/A'}</Text>
          </View>
        )}
        {!loading && error && <Text style={[styles.overlayText, { color: 'tomato' }]}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5E8DD',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    alignItems: 'center',
  },
  header: {
    height: 55,
    width: '100%',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    width: '90%',
    marginTop: 20,
    justifyContent: 'space-around'
  },
  option: {
    width: '40%',
    borderRadius: 20,
    backgroundColor: '#36BA98',
    alignItems: 'center',
    paddingVertical: 14,
  },
  optionSelected: {
    backgroundColor: 'rgb(0,70,9)'
  },
  optionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  },
  textarea: {
    width: '90%',
    backgroundColor: 'rgb(187,187,187)',
    borderRadius: 8,
    marginTop: 18,
    padding: 12,
    minHeight: 140,
    textAlignVertical: 'top'
  },
  middle: {
    width: '90%',
    alignItems: 'center',
    marginTop: 10
  },
  button: {
    backgroundColor: '#187047',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },
  outputBox: {
    width: '90%',
    marginTop: 18,
    height: 180,
    backgroundColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  overlayText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center'
  }
});
