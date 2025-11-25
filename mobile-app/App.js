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
        // Pick the combined probability for display and include label/confidence for UI
        const prob = model === 'unigram' ? json.combined_probs_uni : json.combined_probs_bi;
        const label = model === 'unigram' ? json.combined_label_uni : json.combined_label_bi;
        const confidence = model === 'unigram' ? json.combined_confidence_uni : json.combined_confidence_bi;
        setResult({ model, prob: typeof prob === 'number' ? Math.round(prob * 10000) / 100 : null, label, confidence, raw: json });
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
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Prediction</Text>
              <Text style={styles.resultSub}>{result.model}</Text>
            </View>

            <View style={styles.resultBody}>
              <View style={styles.resultRow}><Text style={styles.small}>Combined Score</Text><Text style={styles.bigProb}>{result.prob !== null ? result.prob + '%' : 'No score'}</Text></View>

              <View style={styles.progressWrap} accessible accessibilityRole="progressbar">
                <View style={[styles.progressGradient, { width: result.prob !== null ? `${Math.max(2, Math.min(100, result.prob))}%` : '2%' }]} />
              </View>

              <View style={styles.metaLine}>
                <Text style={styles.labelBadge}>{result.label || 'N/A'}</Text>
                <Text style={[styles.confidence, { marginLeft: 10 }]}>{typeof result.confidence === 'number' ? (result.confidence*100).toFixed(2) + '%' : (result.confidence || 'N/A')}</Text>
              </View>
            </View>
          </View>
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
    minHeight: 140,
    paddingVertical: 10,
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
  ,
  /* result card */
  resultCard: { width: '100%', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: 12, marginBottom: 6 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  resultTitle: { color: '#dff6ef', fontWeight: '800' },
  resultSub: { color: '#9fbfb0', fontSize: 12 },
  resultBody: { paddingTop: 6 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  small: { fontSize: 14, color: '#c6e9dd' },
  prob: { fontWeight: '700', color: '#fff' },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 8 },
  combinedLabel: { color: '#e6f7ef', fontWeight: '700', marginBottom: 6 },
  progressWrap: { width: '100%', height: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 999, overflow: 'hidden' },
  progressGradient: { height: '100%', backgroundColor: '#0ea37b', borderRadius: 999, width: '30%' },
  bigProb: { color: '#fff', fontWeight: '800' },
  metaLine: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  labelBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(14,163,123,0.12)', color: '#0ee0a0', fontWeight: '700' },
  confidence: { color: '#bfeadd', marginTop: 0, fontSize: 13 },
});
