"use client";
import { useState, useEffect } from "react";

interface MintEvent {
  id: number;
  serial: number;
  state: string;
  timestamp: Date;
}

export function LiveMintFeed() {
  const [events, setEvents] = useState<MintEvent[]>([]);
  const [counter, setCounter] = useState(1000);

  // Simulate live oracle events for demo
  useEffect(() => {
    const addEvent = () => {
      const states = ["NJ", "DC", "MA", "MD"];
      setCounter((c) => {
        const serial = c + 1;
        setEvents((prev) =>
          [
            {
              id: Date.now(),
              serial,
              state: states[Math.floor(Math.random() * states.length)],
              timestamp: new Date(),
            },
            ...prev,
          ].slice(0, 5)
        );
        return serial;
      });
    };

    // First event after 8s, then random 15-30s
    const t1 = setTimeout(addEvent, 8000);
    const t2 = setTimeout(addEvent, 22000);
    const t3 = setTimeout(addEvent, 41000);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  return (
    <div className="card" style={{ padding: "1rem" }}>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: "#44BB44", boxShadow: "0 0 6px #44BB44" }}
        />
        <h3
          className="font-bold text-white text-sm"
          style={{ fontFamily: "Georgia" }}
        >
          Live Oracle Feed
        </h3>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: "#8A96B0" }}>
          Watching for 1 MWh threshold crossings...
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between text-xs py-1"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <span style={{ color: "#F5A623" }}>
                ✨ SREC #{e.serial} minted
              </span>
              <span style={{ color: "#8A96B0" }}>{e.state}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs mt-3" style={{ color: "#8A96B0" }}>
        Oracle polling every 5s · Simulated data
      </p>
    </div>
  );
}
