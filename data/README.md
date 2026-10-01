# NeuroFlex synthetic validation dataset

This folder contains a reproducible generator for 2,000 synthetic welfare records.

Fields:
- stress, sleep, fatigue, workload, connection: voluntary self-reported 1–5 scales
- dutyHours, deploymentDays, leaveGap, trainingLoad, restHours, transferCount: operational/work-pattern features
- welfare_label: prototype development label

The data are synthetic and contain no real personnel records. They are suitable for engineering demonstrations and pipeline testing only. Real deployment requires governed, de-identified institutional data and independent validation.

Run: `node scripts/generate-neuroflex-dataset.mjs`
