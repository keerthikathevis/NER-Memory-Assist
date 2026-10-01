export type WelfareModelInput = {
  stress:number; sleep:number; fatigue:number; workload:number; connection:number;
  dutyHours:number; deploymentDays:number; leaveGap:number; trainingLoad:number; restHours:number; transferCount:number;
};
const MODEL = {
  mean:[3.00438,2.97062,2.95812,2.94875,3.02188,50.37938,27.89938,20.70062,59.5525,7.0015,1.03625],
  scale:[1.43462,1.41722,1.40227,1.40262,1.38613,8.98441,13.30742,11.80341,21.17767,1.19407,1.01764],
  weights:[0.9446,-0.57347,0.75704,0.62367,-0.23697,1.72015,0.90835,0.52112,0.22025,-0.65755,0.16432],
  intercept:-1.4674181587814579, threshold:0.5
} as const;
export const MODEL_VALIDATION = {
  dataset:'synthetic_neuroflex_2000_v1', records:2000, trainRecords:1600, testRecords:400,
  accuracy:0.85, precision:0.7909, recall:0.7016, f1:0.7436, rocAuc:0.9267,
  fiveFoldCvRocAuc:0.9410, fiveFoldCvStd:0.0060
} as const;
const sigmoid = (x:number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))));
export function predictWelfareProbability(input: WelfareModelInput) {
  const values = [input.stress,input.sleep,input.fatigue,input.workload,input.connection,input.dutyHours,input.deploymentDays,input.leaveGap,input.trainingLoad,input.restHours,input.transferCount];
  const z = values.reduce((sum,value,i) => sum + ((value - MODEL.mean[i]) / MODEL.scale[i]) * MODEL.weights[i], MODEL.intercept);
  return sigmoid(z);
}
export function predictiveRiskScore(input: WelfareModelInput) {
  return Math.round(predictWelfareProbability(input) * 100);
}
