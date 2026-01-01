import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import "./CountdownTimer.scss";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function clampNonNegative(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function CountdownTimer() {
  const target = useMemo(
    () => DateTime.fromISO("2024-01-01T00:00:00", { zone: "America/New_York" }),
    []
  );

  const [now, setNow] = useState(() =>
    DateTime.now().setZone("America/New_York")
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(DateTime.now().setZone("America/New_York"));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts: Parts = useMemo(() => {
    const diff = target
      .diff(now, ["days", "hours", "minutes", "seconds"])
      .toObject();
    return {
      days: clampNonNegative(Math.floor(diff.days ?? 0)),
      hours: clampNonNegative(Math.floor(diff.hours ?? 0)),
      minutes: clampNonNegative(Math.floor(diff.minutes ?? 0)),
      seconds: clampNonNegative(Math.floor(diff.seconds ?? 0)),
    };
  }, [now, target]);

  return (
    <div className="count-down-timer">
      {/* 전역 타이포(.font-h1) 그대로 사용 */}
      <h1 className="font-h1">2024 Countdown</h1>

      <div className="wrapper">
        <div className="times">
          {/* 숫자도 전역 .font-h1 사용 (Sass 변수/extend 의존 X) */}
          <p className="font-h1">{parts.days}</p>
          <p className="font-h1">{parts.hours}</p>
          <p className="font-h1">{parts.minutes}</p>
          <p className="font-h1">{parts.seconds}</p>
        </div>

        <div className="description">
          <p>Days</p>
          <p>Hours</p>
          <p>Minutes</p>
          <p>Seconds</p>
        </div>
      </div>
    </div>
  );
}
