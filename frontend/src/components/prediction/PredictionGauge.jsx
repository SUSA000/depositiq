export default function PredictionGauge({ probability, prediction }) {
  const percent = Math.round(Number(probability || 0) * 100);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  return (
    <div className={`prediction-gauge ${prediction}`}>
      <svg viewBox="0 0 168 168" role="img" aria-label={`${percent}% subscription likelihood`}>
        <circle className="gauge-track" cx="84" cy="84" r={radius} />
        <circle className="gauge-progress" cx="84" cy="84" r={radius}
          strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="gauge-content"><strong>{percent}%</strong><span>likelihood</span></div>
    </div>
  );
}
