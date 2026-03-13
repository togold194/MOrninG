import React, { useEffect, useMemo, useState } from "react";

const COLORS = {
  bg: "#09090b",
  panel: "#18181b",
  panel2: "#0f0f12",
  border: "#27272a",
  text: "#fafafa",
  sub: "#a1a1aa",
  accent: "#3b82f6",
  accent2: "#22c55e",
  danger: "#ef4444",
};

function wakeScore(time) {
  if (!time) return 0;
  if (time <= "06:00") return 6;
  if (time <= "06:30") return 5;
  if (time <= "07:00") return 4;
  if (time <= "07:30") return 3;
  if (time <= "08:00") return 2;
  return 0;
}

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function startScore(wake, start) {
  if (!wake || !start) return 0;
  const diff = toMinutes(start) - toMinutes(wake);
  if (diff < 0) return 0;
  if (diff <= 10) return 5;
  if (diff <= 20) return 4;
  if (diff <= 30) return 2;
  return 0;
}

function studyScore(minutes) {
  const m = Number(minutes || 0);
  if (m >= 60) return 6;
  if (m >= 45) return 5;
  if (m >= 30) return 4;
  if (m >= 15) return 2;
  return 0;
}

function penaltyScore({ didSecondSleep, phoneMinutes }) {
  let p = 0;
  if (didSecondSleep) p -= 2;
  if (Number(phoneMinutes || 0) >= 15) p -= 2;
  return p;
}

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getLocalDateKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getStreak(entries) {
  let streak = 0;
  const cursor = new Date();

  for (;;) {
    const key = getLocalDateKey(cursor);
    const entry = entries[key];
    if (entry && entry.total >= 10) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function cardStyle(extra = {}) {
  return {
    background: COLORS.panel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 24,
    padding: 20,
    ...extra,
  };
}

function inputStyle() {
  return {
    width: "100%",
    background: COLORS.panel2,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    padding: "12px 14px",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
  };
}

function buttonStyle(primary = true) {
  return {
    border: `1px solid ${primary ? COLORS.accent : COLORS.border}`,
    background: primary ? COLORS.accent : COLORS.panel2,
    color: COLORS.text,
    borderRadius: 16,
    padding: "12px 18px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  };
}

function badgeStyle(bg) {
  return {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 9999,
    background: bg,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 700,
  };
}

function ScoreRow({ emoji, label, value, sub }) {
  return (
    <div
      style={{
        ...cardStyle({ background: COLORS.panel2, padding: 16, borderRadius: 18 }),
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            fontSize: 18,
          }}
        >
          {emoji}
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>{label}</div>
          <div style={{ fontSize: 12, color: COLORS.sub }}>{sub}</div>
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 20 }}>{value}</div>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div
      style={{
        width: "100%",
        height: 12,
        background: COLORS.panel2,
        borderRadius: 9999,
        overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: COLORS.accent,
          transition: "width 0.2s ease",
        }}
      />
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState({
    wakeTime: "",
    studyStartTime: "",
    studyMinutes: "",
    phoneMinutes: "",
    didSecondSleep: false,
    memo: "",
  });

  const [entries, setEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("morning-study-points") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("morning-study-points", JSON.stringify(entries));
  }, [entries]);

  const scores = useMemo(() => {
    const wake = wakeScore(form.wakeTime);
    const start = startScore(form.wakeTime, form.studyStartTime);
    const study = studyScore(form.studyMinutes);
    const penalty = penaltyScore(form);
    const subtotal = wake + start + study + penalty;

    return {
      wake,
      start,
      study,
      penalty,
      subtotal: Math.max(0, subtotal),
    };
  }, [form]);

  const streak = useMemo(() => getStreak(entries), [entries]);
  const streakBonus = streak >= 7 ? 8 : streak >= 5 ? 5 : streak >= 3 ? 3 : 0;
  const todaysTotal = scores.subtotal + streakBonus;

  const weeklyTotal = useMemo(() => {
    const now = new Date();
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      total += entries[getLocalDateKey(d)]?.total || 0;
    }
    return total;
  }, [entries]);

  const recent = useMemo(() => {
    return Object.entries(entries)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7);
  }, [entries]);

  const grade =
    todaysTotal >= 16
      ? "神"
      : todaysTotal >= 12
      ? "強い"
      : todaysTotal >= 8
      ? "合格"
      : todaysTotal >= 4
      ? "微妙"
      : "立て直し";

  const progress = Math.min(100, (todaysTotal / 18) * 100);

  function saveToday() {
    const key = todayKey();
    setEntries((prev) => ({
      ...prev,
      [key]: {
        ...form,
        ...scores,
        streakBonus,
        total: todaysTotal,
        savedAt: new Date().toISOString(),
      },
    }));
  }

  function resetForm() {
    setForm({
      wakeTime: "",
      studyStartTime: "",
      studyMinutes: "",
      phoneMinutes: "",
      didSecondSleep: false,
      memo: "",
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily:
          'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <div style={cardStyle()}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -0.5 }}>
                朝勉ポイント
              </div>
              <div style={{ marginTop: 8, color: COLORS.sub }}>
                起床 → 勉強開始 → 継続 を点数化して、朝を仕組みで取る。
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={badgeStyle(COLORS.accent)}>今日の評価: {grade}</span>
              <span style={badgeStyle("#27272a")}>連続 {streak} 日</span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 20,
          }}
          className="top-grid"
        >
          <div style={cardStyle()}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 18 }}>
              今日を記録する
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
              className="form-grid"
            >
              <div>
                <div style={{ marginBottom: 8, fontWeight: 700 }}>起床時刻</div>
                <input
                  type="time"
                  value={form.wakeTime}
                  onChange={(e) => setForm({ ...form, wakeTime: e.target.value })}
                  style={inputStyle()}
                />
              </div>

              <div>
                <div style={{ marginBottom: 8, fontWeight: 700 }}>勉強開始時刻</div>
                <input
                  type="time"
                  value={form.studyStartTime}
                  onChange={(e) => setForm({ ...form, studyStartTime: e.target.value })}
                  style={inputStyle()}
                />
              </div>

              <div>
                <div style={{ marginBottom: 8, fontWeight: 700 }}>朝勉時間（分）</div>
                <input
                  type="number"
                  placeholder="30"
                  value={form.studyMinutes}
                  onChange={(e) => setForm({ ...form, studyMinutes: e.target.value })}
                  style={inputStyle()}
                />
              </div>

              <div>
                <div style={{ marginBottom: 8, fontWeight: 700 }}>
                  起床後スマホ時間（分）
                </div>
                <input
                  type="number"
                  placeholder="0"
                  value={form.phoneMinutes}
                  onChange={(e) => setForm({ ...form, phoneMinutes: e.target.value })}
                  style={inputStyle()}
                />
              </div>

              <div
                style={{
                  ...cardStyle({
                    background: COLORS.panel2,
                    padding: 16,
                    borderRadius: 18,
                    gridColumn: "1 / -1",
                  }),
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <input
                  id="second-sleep"
                  type="checkbox"
                  checked={form.didSecondSleep}
                  onChange={(e) =>
                    setForm({ ...form, didSecondSleep: e.target.checked })
                  }
                />
                <label htmlFor="second-sleep" style={{ cursor: "pointer", fontWeight: 700 }}>
                  二度寝した
                </label>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ marginBottom: 8, fontWeight: 700 }}>メモ</div>
                <textarea
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  placeholder="今日は何が良かったか / 何で崩れたか"
                  style={{
                    ...inputStyle(),
                    minHeight: 120,
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={saveToday} style={buttonStyle(true)}>
                  今日を保存
                </button>
                <button onClick={resetForm} style={buttonStyle(false)}>
                  リセット
                </button>
              </div>
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 18 }}>
              今日のスコア
            </div>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: 14,
                }}
              >
                <span>合計</span>
                <span>{todaysTotal} 点</span>
              </div>
              <ProgressBar value={progress} />
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <ScoreRow emoji="⏰" label="起床" value={scores.wake} sub="6点満点" />
              <ScoreRow emoji="📚" label="開始速度" value={scores.start} sub="5点満点" />
              <ScoreRow emoji="🏆" label="朝勉時間" value={scores.study} sub="6点満点" />
              <ScoreRow emoji="📱" label="ペナルティ" value={scores.penalty} sub="-4点まで" />
              <ScoreRow emoji="🔥" label="連続ボーナス" value={streakBonus} sub="最大+8点" />
            </div>

            <div
              style={{
                ...cardStyle({
                  background: COLORS.panel2,
                  padding: 16,
                  borderRadius: 18,
                  marginTop: 16,
                }),
                color: COLORS.sub,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              目安: 10点以上で朝成功、14点以上でかなり強い。まずは毎日10点を切らないことを狙う。
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
          className="bottom-grid"
        >
          <div style={cardStyle()}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 18 }}>
              最近7日
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {recent.length === 0 ? (
                <div style={{ color: COLORS.sub, fontSize: 14 }}>
                  まだ記録がない。今日から1日目を作れ。
                </div>
              ) : (
                recent.map(([date, entry]) => (
                  <div
                    key={date}
                    style={{
                      ...cardStyle({
                        background: COLORS.panel2,
                        padding: 16,
                        borderRadius: 18,
                      }),
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>{date}</div>
                      <div style={{ color: COLORS.sub, fontSize: 14, marginTop: 4 }}>
                        起床 {entry.wakeTime || "-"} / 開始 {entry.studyStartTime || "-"} /{" "}
                        {entry.studyMinutes || 0}分
                      </div>
                    </div>
                    <span style={badgeStyle(COLORS.accent)}>{entry.total} 点</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 18 }}>
              今週の状況
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <div
                style={{
                  ...cardStyle({
                    background: COLORS.panel2,
                    padding: 18,
                    borderRadius: 18,
                  }),
                }}
              >
                <div style={{ color: COLORS.sub, fontSize: 14 }}>7日合計</div>
                <div style={{ fontSize: 38, fontWeight: 900, marginTop: 6 }}>
                  {weeklyTotal}
                  <span style={{ fontSize: 18, color: COLORS.sub, marginLeft: 6 }}>pts</span>
                </div>
              </div>

              <div
                style={{
                  ...cardStyle({
                    background: COLORS.panel2,
                    padding: 18,
                    borderRadius: 18,
                  }),
                }}
              >
                <div style={{ color: COLORS.sub, fontSize: 14 }}>現在の連続記録</div>
                <div style={{ fontSize: 38, fontWeight: 900, marginTop: 6 }}>
                  {streak}
                  <span style={{ fontSize: 18, color: COLORS.sub, marginLeft: 6 }}>days</span>
                </div>
              </div>

              <div
                style={{
                  ...cardStyle({
                    background: COLORS.panel2,
                    padding: 18,
                    borderRadius: 18,
                  }),
                  color: COLORS.sub,
                  lineHeight: 1.7,
                  fontSize: 14,
                }}
              >
                このアプリは localStorage 保存。まずは試作としてそのまま使える。
                次にやるなら、通知、月間グラフ、報酬システム、スマホ最適化を足せばさらに強くなる。
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: ${COLORS.bg};
        }

        @media (max-width: 900px) {
          .top-grid,
          .bottom-grid,
          .form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
