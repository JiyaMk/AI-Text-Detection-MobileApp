import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';

const API_BASE = 'http://192.168.43.9:5000';

export default function App() {
  const [model, setModel] = useState('unigram');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, text }),
      });

      const json = await resp.json();
      if (!resp.ok) {
        setError(json.error || 'Server error');
      } else {
        // Pick the combined probability for display
        const prob = model === 'unigram' ? json.combined_probs_uni : json.combined_probs_bi;
        setResult({ model, prob: typeof prob === 'number' ? Math.round(prob * 10000) / 100 : null, raw: json });
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }

    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerText}>AI Text Detector</Text></View>

      <View style={styles.controls}>
        <View style={[styles.option, model === 'unigram' && styles.optionSelected]}>
          <TouchableOpacity onPress={() => setModel('unigram')} style={styles.touchArea}>
            <Text style={styles.optionText}>Unigram</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.option, model === 'bigram' && styles.optionSelected]}>
          <TouchableOpacity onPress={() => setModel('bigram')} style={styles.touchArea}>
            <Text style={styles.optionText}>Bigram</Text>
          </TouchableOpacity>
        </View>
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
          <Text style={styles.overlayText}>{result.model.charAt(0).toUpperCase() + result.model.slice(1)} Probability: {result.prob !== null ? result.prob + '%' : 'No score'}</Text>
        )}

        {!loading && error && (
          <Text style={[styles.overlayText, { color: 'tomato' }]}>{error}</Text>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
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
  touchArea: { width: '100%', alignItems: 'center' },
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
