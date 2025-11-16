# Hybrid Fallback RAG System

## ✅ Implemented Features

Your RAG pipeline now includes a comprehensive hybrid fallback strategy that handles low or no evidence gracefully.

### Architecture Overview

```
Query → Embedding → Pinecone Search
         ↓
    Check Top Score
         ↓
    ┌────────────────┐
    │ Score ≥ 0.80?  │ → YES → High Confidence (Grounded Response)
    └────────────────┘
         ↓ NO
    ┌────────────────┐
    │ Score ≥ 0.70?  │ → YES → Partial Confidence (Sources + Model Knowledge)
    └────────────────┘
         ↓ NO
    ┌────────────────┐
    │ Score ≥ 0.60?  │ → YES → Low Confidence (Primarily Model Knowledge)
    └────────────────┘
         ↓ NO
    ┌────────────────┐
    │ Expand Search  │ → Try 2x-3x topK
    └────────────────┘
         ↓ Still Low?
    ┌────────────────┐
    │ Fallback Mode  │ → LLM-Only with Safety Instructions
    └────────────────┘
```

## Score Thresholds (Configurable in .env)

| Threshold | Value | Behavior |
|-----------|-------|----------|
| `RAG_THRESHOLD_HIGH` | 0.80 | **Grounded**: Use sources as primary reference |
| `RAG_THRESHOLD_PARTIAL` | 0.70 | **Partially Grounded**: Sources + model knowledge |
| `RAG_THRESHOLD_FALLBACK` | 0.60 | **Low Grounded**: Primarily model knowledge |
| Below 0.60 | - | **Fallback**: LLM-only with expanded search attempt |

## Response Types & Labels

### 1. Grounded Response (Score ≥ 0.80)
- **Label**: `grounded`
- **Confidence**: `high`
- **Strategy**: Use retrieved sources as primary reference
- **Prompt**: "Use the provided sources as your primary reference (highly relevant)"
- **UI Badge**: ✅ High Confidence
- **Temperature**: 0.2

### 2. Partially Grounded (0.70 ≤ Score < 0.80)
- **Label**: `partially_grounded`
- **Confidence**: `partial`
- **Strategy**: Use sources where applicable, supplement with model knowledge
- **Prompt**: "Sources may not fully answer - supplement with medical knowledge"
- **UI Badge**: ⚠️ Partial Confidence
- **Temperature**: 0.4

### 3. Low Grounded (0.60 ≤ Score < 0.70)
- **Label**: `low_grounded`
- **Confidence**: `low`
- **Strategy**: Primarily model knowledge, reference sources if useful
- **Prompt**: "Sources have limited relevance - primarily use medical knowledge"
- **UI Badge**: ⚠️ Low Confidence
- **Temperature**: 0.4

### 4. Model Fallback (Score < 0.60 or No Results)
- **Label**: `model_fallback`
- **Confidence**: `fallback`
- **Strategy**: LLM-only with safety-focused prompts
- **Format**: Structured medical assessment
- **UI Badge**: 🤖 Model-Only Response
- **Warning**: "Model-based response — not source-backed"

## Fallback Response Format

When retrieval fails or returns very low scores, the system generates structured responses:

```markdown
**Model-based — not source-backed** (Confidence: [High/Moderate/Low])

**Assessment:**
[Most likely diagnosis/condition and rationale]

**Key Supporting Findings:**
1. [Clinical finding from question]
2. [Clinical finding from question]
3. [Clinical finding from question]

**Confirmatory Tests:**
1. [Specific test name] - [What it shows]
2. [Specific test name] - [What it shows]
3. [Specific test name] - [What it shows]

**Immediate Recommendations:**
[Specific next steps: urgent care / ER / specialist]

**Safety Note:**
This is a model-based interpretation; confirm with diagnostic testing and a qualified clinician.
```

## Safety Features

### Medical Safety Rules (All Modes)
1. ✅ Never provide definitive diagnoses (use "likely" or "possible")
2. ✅ Never prescribe medications or specific dosages
3. ✅ Always recommend emergency services for serious situations
4. ✅ State uncertainty level clearly when applicable
5. ✅ Include explicit safety disclaimers in fallback mode

### Fallback Mode Specific
- **No Self-Treatment**: Avoid step-by-step self-treatment instructions
- **No False Certainty**: Never assert certainty where complexity exists
- **Explicit Labeling**: Always mark as "Model-based — not source-backed"
- **Conservative Approach**: Recommend clinical consultation
- **Specific Tests**: List exact diagnostic tests needed

## Expanded Retrieval Logic

When initial search returns low or no results:

```javascript
// Step 1: Initial search (topK = 5-10)
results = queryPinecone(embedding, topK);

// Step 2: Check if expansion needed
if (topScore < 0.60 || results.length === 0) {
  // Attempt 1: Double the search
  results = queryPinecone(embedding, topK * 2);
}

if (topScore < 0.60 || results.length === 0) {
  // Attempt 2: Triple the search
  results = queryPinecone(embedding, topK * 3);
}

// Step 3: Evaluate final score and choose strategy
if (finalTopScore >= 0.80) → High confidence path
else if (finalTopScore >= 0.70) → Partial confidence path
else if (finalTopScore >= 0.60) → Low confidence path
else → Fallback mode
```

## Analytics & Logging

Every RAG query is logged with:
- `sessionId`: Session identifier
- `query`: User's question
- `topScore`: Highest relevance score
- `confidenceLevel`: high / partial / low / fallback
- `responseLabel`: grounded / partially_grounded / low_grounded / model_fallback
- `sourcesUsed`: Number of sources included
- `emergency`: Emergency flag
- `fallbackReason`: Why fallback was triggered (if applicable)

**Use Cases for Logs:**
- Monitor retrieval quality over time
- Identify queries needing better sources
- Curate high-quality fallback answers for dataset addition
- A/B test different thresholds
- Track model performance

## Frontend Integration

The UI now displays:

### Confidence Badges
- ✅ **High Confidence**: Green badge, sources highly relevant
- ⚠️ **Partial Confidence**: Yellow badge, sources partially relevant
- ⚠️ **Low Confidence**: Orange badge, limited source relevance
- 🤖 **Model-Only**: Gray badge, no sources or very low relevance

### Color-Coded Sources
- **Green background**: High confidence sources (≥0.80)
- **Yellow background**: Partial confidence sources (0.70-0.79)
- **Orange background**: Low confidence sources (0.60-0.69)
- **Gray background**: Fallback mode sources (<0.60)

### Score Display
Each source card shows:
- Relevance percentage (score * 100)
- Color-coded badge (green/yellow/orange based on score)
- Dataset source
- Preview text

## Configuration (.env)

```bash
# RAG Thresholds (tune based on your embeddings and metrics)
RAG_THRESHOLD_HIGH=0.80        # High confidence: grounded response
RAG_THRESHOLD_PARTIAL=0.70     # Partial: sources + model knowledge
RAG_THRESHOLD_FALLBACK=0.60    # Below: primarily model knowledge

# Retrieval Configuration
RAG_TOP_K=8                     # Initial retrieval count
RAG_RERANK_TOP_K=3             # Final sources after reranking
RAG_RERANK_ENABLED=true        # Enable two-stage retrieval
```

## Example Scenarios

### Scenario 1: High Confidence Match
```
Query: "What are the symptoms of type 2 diabetes?"
Top Score: 0.87
Result: Grounded response with 3 highly relevant sources
Label: ✅ High Confidence
```

### Scenario 2: Partial Match
```
Query: "How does metformin affect insulin resistance?"
Top Score: 0.73
Result: Partially grounded - uses sources + model knowledge to explain mechanism
Label: ⚠️ Partial Confidence
```

### Scenario 3: Low Match with Fallback
```
Query: "A 6-year-old with sickle cell disease showing elongated cells..."
Top Score: 0.42 (even after expanded search)
Result: Model-based structured assessment with:
  - Likely diagnosis: Sickle cell disease (vaso-occlusive crisis)
  - Key findings: anemia, sickled cells, recurrent pain
  - Confirmatory tests: hemoglobin electrophoresis, CBC, sickle prep
  - Recommendations: Urgent hematology consult or ER
Label: 🤖 Model-Only Response
Warning: "Model-based response — not source-backed"
```

### Scenario 4: No Results → Expanded → Fallback
```
Query: "Rare genetic condition XYZ treatment protocol"
Initial Search: 0 results
Expanded Search (2x): 0 results
Expanded Search (3x): 0 results
Result: Fallback mode with explicit uncertainty statement
Label: 🤖 Model-Only Response
```

## Testing the System

### Test Case 1: High Confidence Query
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is diabetes mellitus?", "emergency": false}'
```
Expected: `confidenceLevel: "high"`, `responseLabel: "grounded"`

### Test Case 2: Obscure Medical Query
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Rare autosomal recessive metabolic disorder with enzyme deficiency", "emergency": false}'
```
Expected: `confidenceLevel: "fallback"`, structured medical assessment

### Test Case 3: Complex Clinical Case
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "6-year-old African American with Hgb 6.5, retic 7%, elongated sickled cells on smear", "emergency": false}'
```
Expected: Model-based response with differential diagnosis, tests, and recommendations

## Continuous Improvement Workflow

1. **Monitor Logs**: Review `[RAG Analytics]` console output
2. **Identify Patterns**: Find queries with low scores or fallback mode
3. **Curate Answers**: When fallback generates good answers, validate them
4. **Add to Dataset**: Add validated Q/A pairs to embedding dataset
5. **Re-embed**: Periodically re-run embedding to include curated content
6. **Tune Thresholds**: Adjust thresholds based on precision/recall metrics

## Future Enhancements

- [ ] Database logging (currently console-only)
- [ ] Human-in-the-loop validation for fallback answers
- [ ] A/B testing framework for threshold optimization
- [ ] Ensemble responses (combine multiple LLM outputs)
- [ ] Cross-encoder reranking for better score calibration
- [ ] Automatic dataset curation pipeline
- [ ] User feedback collection ("Was this helpful?")
- [ ] Query expansion/reformulation before fallback

## Emergency Mode Behavior

All confidence levels preserve emergency mode behavior:
- 🚨 Start with "CALL EMERGENCY SERVICES IMMEDIATELY (911/112/108)"
- Provide only critical immediate actions
- Keep instructions extremely clear and brief
- Lower temperature (0.1) for consistency
- Higher max tokens (1500) for detailed instructions

---

**Status**: ✅ Fully implemented and ready for testing

**Next Steps**:
1. Test with medical queries in `frontend-test.html`
2. Monitor `[RAG Analytics]` logs for retrieval quality
3. Tune thresholds based on your specific embedding model and dataset
4. Implement database logging for long-term analytics
