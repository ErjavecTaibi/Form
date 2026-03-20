# Market Research - Singing Voice Analysis API

Date: 2026-03-20

## 1) Executive Summary

Goal: Build a B2B API that estimates singer attributes (voice type, age range, style, etc.) and provides objective metrics (pitch accuracy, vibrato characteristics, stability, etc.) from short audio tasks.

High-level takeaways:
- There is clear user demand for pitch/range/vibrato feedback in consumer apps. Multiple apps already expose these features in real time.
- There are few public, developer-friendly APIs for **singing** analysis. B2B offerings appear more common in auditions/talent screening than in vocal training.
- The strongest near-term wedge is an **API-first** product with reliable, explainable metrics (pitch accuracy, vibrato rate/depth, stability) and a clear data collection pipeline for training.
- Public datasets exist for singing and choral voices, but labels for **voice type** and **age** are sparse or inconsistent. A purpose-built dataset with expert labels is likely required.

## 2) Competitive Landscape

### 2.1 Consumer Apps and Web Tools (similar features, non-API)

Vocalizer (iOS):
- Pitch training, vocal range, voice type classification, vibrato analysis.
- Pricing: Free with in‑app purchases (US App Store shows $4.99 monthly, $39.99 annual).
- https://apps.apple.com/us/app/vocalizer/id6757826523

Singscope (iOS):
- Real-time pitch graph, pitch stability, vibrato observation.
- Pricing: Not listed on site (App Store pricing varies by region).
- https://www.singscope.com/

Vocal Range - Pitch Detector (iOS):
- Vocal range and voice type (bass/tenor/alto/soprano) detection.
- Pricing: Free with in‑app purchases.
- https://apps.apple.com/id/app/vocalrange-pro/id1427559596/

KaraDoReMi (iOS):
- Karaoke scoring with pitch and singing skills like vibrato and portamento.
- Pricing: Free with in‑app purchases (US App Store shows $0.99 daily, $2.99 weekly, $5.99 monthly, $17.99 90‑day, $34.99 180‑day, $69.99 yearly).
- https://apps.apple.com/us/app/karadoremi-your-karaoke-pal/id1150272277

Karaokely (web + iOS):
- Real‑time pitch/F0 tracking and scoring, word alignment, vocal separation.
- Pricing: Free to download noted on the site; no public pricing for premium features.
- https://karaokely.com/

Sound Tools: Voice Range Online (web):
- Vocal range test using pYIN pitch tracking.
- Pricing: Free web app.
- https://sound-tools.net/en/voice-range-online-info/

VoiceDash Voice Type Test (web):
- Voice type & range analyzer (record a short vocal glide).
- Pricing: Free web tool.
- https://www.voicedash.ai/tools/voice-type-test

Pitch Detector websites:
- Browser‑based pitch detection and tuning accuracy, some include “vocal analyzer”.
- Pricing: Free.
- https://pitchdetector.io/
- https://pitchdetector.com/

### 2.2 B2B / Enterprise (auditions and analysis)

Gayo (audition analysis, B2B):
- Bulk audio analysis, AI scoring (pitch, rhythm, stability, energy).
- Offers API access for auditions.
- Pricing: Not listed publicly.
- https://gayo.me/

### 2.3 Implications

What’s common:
- Most consumer products focus on **pitch tracking**, **range**, and **basic scoring**.
- Features are typically shown as **visual feedback**, not as an API with contracts/SLAs.

What looks under‑served:
- API‑first offering that can be embedded by coaches, choirs, or karaoke platforms.
- Multi‑task outputs: “objective” metrics plus interpretable voice‑type classification.
- Transparent metrics and calibrated scoring for pedagogical use.

## 3) Datasets (Public, Useful for Bootstrapping)

VocalSet:
- 10.1 hours, 20 professional singers, techniques and vowels.
- Useful for pitch and timbre modeling.
- https://zenodo.org/records/1442513

Annotated VocalSet:
- Adds pitch and note annotations to VocalSet audio.
- https://zenodo.org/records/7061507

SVQTD (Singing Voice Quality and Technique Database):
- Tenor classical dataset, labeled on 7 paralinguistic vocal pedagogy scales.
- 10.7 hours, 4–20s segments.
- https://yanzexu.xyz/SVQTD/

DAMP-S-AG:
- Large dataset of many people singing the same song (“Amazing Grace”).
- Good for studying variation and pitch accuracy.
- https://zenodo.org/records/3596940

ESMUC Choir Dataset:
- Multitrack SATB choir recordings, 12 singers, individual mics.
- Includes annotations of F0 contours and notes.
- https://zenodo.org/records/5848990

SATB Choral Source Separation Dataset (Hugging Face):
- Chunks derived from the Choral Singing Dataset with SATB sources.
- https://huggingface.co/datasets/EwanB/satb-choral-dataset

ChoralSynth:
- Synthetic multitrack choral dataset with voice‑part metadata.
- https://zenodo.org/records/10137883

GTSinger:
- Multilingual dataset, multiple ranges, labels for techniques including vibrato.
- https://huggingface.co/datasets/YGGYY/GTSinger

### Dataset Gaps

- Few datasets label **age** or **voice type** explicitly for singing.
- Many datasets are **speech** or **single technique** focused, or synthetic.
- Most datasets are **not representative** of varied recording conditions found in real users.

## 4) Metrics Without ML (Today)

These can be implemented now for an MVP:
- Pitch accuracy and cents error (standard pitch detection).
- Vibrato rate and depth (Essentia provides vibrato frequency and extent).
- Jitter and shimmer (voice quality perturbation measures in Praat).
- Harmonicity / HNR (voice periodicity / noise ratio in Praat).

References:
- Essentia Vibrato algorithm: https://essentia.upf.edu/reference/std_Vibrato.html
- Praat Harmonicity (HNR): https://praat.org/manual/Harmonicity.html
- VoiceLab: Praat‑derived jitter/shimmer measures: https://voice-lab.github.io/VoiceLab/index.html

## 5) API Design Patterns (What Customers Expect)

Common approach in audio APIs:
- Upload or provide a URL to audio.
- Asynchronous job returns `job_id`.
- Poll `GET /jobs/{id}` or receive a webhook callback.
- Return results JSON containing features, confidence, and metadata.

This mirrors patterns used in large audio AI APIs (speech‑to‑text), and customers already understand this workflow.

## 6) Pricing Benchmarks (Analogous Audio APIs)

Note: These prices are for speech‑to‑text APIs, used here as **benchmarks** for per‑minute audio processing.

Deepgram:
- Pricing listed per minute for transcription (e.g., Nova‑3 model $0.0077/min pay‑as‑you‑go on the pricing page).
- https://deepgram.com/pricing

AssemblyAI:
- Pay‑as‑you‑go listed per hour for transcription (pricing page shows “as low as $0.15/hr”).
- https://www.assemblyai.com/pricing

Google Cloud Speech‑to‑Text (On‑Prem pricing page):
- Pricing listed per 15 seconds (example: $0.006 per 15 seconds after free tier).
- https://cloud.google.com/speech-to-text/priv/pricing

AWS Transcribe:
- Pricing is region and tier dependent; AWS docs confirm per‑second billing with 15‑second minimum.
- https://docs.aws.amazon.com/transcribe/latest/dg/what-is.html
- AWS example pricing doc shows $0.024/min for standard transcription in a sample cost model.
- https://docs.aws.amazon.com/solutions/latest/media2cloud-on-aws/cost.html

## 7) Viability and Differentiation (Opinion)

What seems viable:
- Accurate pitch tracking + vibrato metrics + stability can be delivered reliably now.
- Voice‑type classification from a short task is plausible but needs careful calibration and labels.

Where you can be better:
- Multi‑task analysis (sustained vowels, scale runs, short melody, known chorus) helps stabilize classification and reduce false positives.
- Explicit confidence scores per attribute so coaches can interpret results safely.
- A blended model + rules approach (ML for timbre/style, rules for range‑based SATB).
- A “coach‑friendly” result schema (e.g., actionable notes and thresholds).

Risk areas:
- Age estimation from singing is poorly covered in public datasets; likely needs your own labels.
- Voice type is not just range; timbre and technique matter. Misclassification is common in simple range tests.

## 8) Recommendations for Your Next Step

1. Build an MVP API with non‑ML metrics (pitch accuracy, vibrato rate/depth, stability, HNR).
2. Launch a data collection form with strong consent + labeling instructions for coaches.
3. Train a first‑pass classifier for voice type using a mix of public data + your own labeled samples.
4. Add a “quality gate” that rejects low‑quality recordings to avoid noisy labels.
