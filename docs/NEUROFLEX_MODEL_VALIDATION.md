# NeuroFlex predictive model validation

- Model: Logistic regression v1
- Dataset: synthetic_neuroflex_2000_v1
- Records: 2,000 (1,600 train / 400 test)
- Hold-out accuracy: 85.0%
- Precision: 79.1%
- Recall: 70.2%
- F1: 74.4%
- Hold-out ROC-AUC: 0.927
- 5-fold CV ROC-AUC: 0.941 ± 0.006

These are development metrics from synthetic prototype data. They demonstrate the predictive pipeline and must not be presented as clinical or operational validation. Before real deployment, retrain and revalidate on governed, representative, de-identified institutional data, including calibration, subgroup fairness, robustness and false-positive/false-negative analysis.
