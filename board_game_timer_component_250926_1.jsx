import React, { useEffect, useRef, useState } from "react";

export default function BoardGameTimer() {
  const [players, setPlayers] = useState([
    { id: 1, number: 1, name: "Gracz 1", elapsedMs: 0, score: 0 },
    { id: 2, number: 2, name: "Gracz 2", elapsedMs: 0, score: 0 },
  ]);
  const [activeId, setActiveId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [pulseSpeed, setPulseSpeed] = useState(null);
  const [warning, setWarning] = useState(false);
  const startedAtRef = useRef(null);
  const nextIdRef = useRef(3);

  function formatMs(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    const tenths = Math.floor((ms % 1000) / 100);
    return `${minutes}:${seconds}.${tenths}`;
  }

  function startFor(id) {
    if (isRunning && activeId !== null && activeId !== id) stopAccumulation();
    setActiveId(id);
    startedAtRef.current = Date.now();
    setIsRunning(true);
    setWarning(false);
  }

  function pause() {
    if (!isRunning || activeId === null) return;
    stopAccumulation();
    setIsRunning(false);
    startedAtRef.current = null;
  }

  function stopAccumulation() {
    if (activeId === null || startedAtRef.current === null) return;
    const delta = Date.now() - startedAtRef.current;
    setPlayers(prev => prev.map(p => (p.id === activeId ? { ...p, elapsedMs: p.elapsedMs + delta } : p)));
  }

  function nextPlayer() {
    if (players.length === 0) return;
    if (isRunning) stopAccumulation();
    const order = players.map(p => p.id);
    let idx = activeId === null ? -1 : order.indexOf(activeId);
    idx = (idx + 1) % order.length;
    const nextId = order[idx];
    setActiveId(nextId);
    startedAtRef.current = Date.now();
    setIsRunning(true);
    setWarning(false);
  }

  function shufflePlayers() {
    // Keep original numbers, rotate order so first player is random
    if (players.length === 0) return;
    const firstIdx = Math.floor(Math.random() * players.length);
    const rotated = [...players.slice(firstIdx), ...players.slice(0, firstIdx)];
    setPlayers(rotated);
    setActiveId(rotated[0].id);
    startedAtRef.current = Date.now();
    setIsRunning(true);
    setWarning(false);
  }

  function addPlayer(name = "Nowy gracz") {
    setPlayers(p => {
      if (p.length >= 9) return p;
      const id = nextIdRef.current++;
      const number = p.length + 1;
      return [...p, { id, number, name: `${name} ${number}`, elapsedMs: 0, score: 0 }];
    });
  }

  function removePlayer(id) {
    if (isRunning && activeId === id) {
      stopAccumulation();
      setIsRunning(false);
      startedAtRef.current = null;
      setActiveId(null);
    }
    setPlayers(p => p.filter(x => x.id !== id).map((pl, idx) => ({ ...pl, number: idx + 1 })));
  }

  function renamePlayer(id, newName) {
    setPlayers(prev => prev.map(p => (p.id === id ? { ...p, name: newName } : p)));
  }

  function updateScore(id, delta) {
    setPlayers(prev => prev.map(p => (p.id === id ? { ...p, score: p.score + delta } : p)));
  }

  function resetAll() {
    setPlayers(prev => prev.map(p => ({ ...p, elapsedMs: 0, score: 0 })));
    setActiveId(null);
    setIsRunning(false);
    setPulseSpeed(null);
    setWarning(false);
    startedAtRef.current = null;
  }

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setPlayers(prev => [...prev]), 200);
    return () => clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    if (activeId === null || !isRunning) {
      setPulseSpeed(null);
      setWarning(false);
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      if (elapsed < 20000) setPulseSpeed(2.0);
      else if (elapsed < 40000) setPulseSpeed(1.5);
      else if (elapsed < 60000) setPulseSpeed(1.0);
      else if (elapsed < 120000) setPulseSpeed(0.7);
      else {
        setPulseSpeed(0.4);
        setWarning(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeId, isRunning]);

  function displayedElapsed(p) {
    if (isRunning && activeId === p.id && startedAtRef.current) {
      return p.elapsedMs + (Date.now() - startedAtRef.current);
    }
    return p.elapsedMs;
  }

  function CirclePlayers() {
    const radius = 120;
    const center = 150;
    const angleStep = (2 * Math.PI) / players.length;
    return (
      <svg width={300} height={300} className="mx-auto my-6">
        {players.map((p, idx) => {
          const angle = idx * angleStep - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <g key={p.id} onClick={() => startFor(p.id)} className="cursor-pointer">
              <circle
                cx={x}
                cy={y}
                r={25}
                fill={activeId === p.id ? "#10B981" : "#CBD5E1"}
                stroke="#1F2937"
                strokeWidth={2}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-black font-bold"
              >
                {p.number}
              </text>
            </g>
          );
        })}

        <g onClick={nextPlayer} className="cursor-pointer">
          <circle
            cx={center}
            cy={center}
            r={45}
            fill={warning ? "#EF4444" : "#8B5CF6"}
            stroke="#1F2937"
            strokeWidth={3}
          >
            {pulseSpeed && (
              <animate attributeName="r" values="45;65;45" dur={`${pulseSpeed}s`} repeatCount="indefinite" />
            )}
          </circle>
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white font-bold text-lg select-none pointer-events-none"
          >
            Następny
          </text>
        </g>
      </svg>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Timer ruchów — aplikacja do gier planszowych</h2>

      <div className="mb-4 flex gap-2 flex-wrap">
        <button className="px-3 py-1 rounded-lg shadow-sm bg-blue-500 text-white hover:bg-blue-600" onClick={() => addPlayer("Gracz")}>Dodaj gracza</button>
        <button className={`px-3 py-1 rounded-lg shadow-sm ${isRunning ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"} text-white`} onClick={() => {if (!isRunning && activeId !== null) startFor(activeId); else pause();}}>{isRunning ? "Pauza" : activeId === null ? "Start (wybierz gracza)" : "Wznów"}</button>
        <button className="px-3 py-1 rounded-lg shadow-sm bg-purple-500 text-white hover:bg-purple-600" onClick={nextPlayer}>Następny</button>
        <button className="px-3 py-1 rounded-lg shadow-sm bg-red-500 text-white hover:bg-red-600" onClick={resetAll}>Resetuj czasy</button>
        <button className="px-3 py-1 rounded-lg shadow-sm bg-pink-500 text-white hover:bg-pink-600" onClick={shufflePlayers}>Losuj pierwszego</button>
      </div>

      <CirclePlayers />

      <div className="bg-white rounded-xl shadow p-3">
        {players.length === 0 ? (
          <div className="text-gray-500">Brak graczy. Dodaj pierwszego.</div>
        ) : (
          <ul className="space-y-2">
            {players.map(p => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <button title="Ustaw jako aktywny" onClick={() => startFor(p.id)} className={`w-3 h-3 rounded-full ${activeId === p.id ? "bg-green-500" : "bg-gray-300"} shrink-0`} />
                  <div className="flex flex-col">
                    <input value={p.name} onChange={e => renamePlayer(p.id, e.target.value)} className="text-lg font-medium focus:outline-none border-b pb-0.5" />
                    <div className="text-sm text-gray-500">Ruch: {formatMs(displayedElapsed(p))}</div>
                    <div className="text-sm text-gray-700">Gracz #{p.number} — Punkty: {p.score}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="number" defaultValue={0} className="w-16 border rounded p-0.5 text-sm" id={`score-input-${p.id}`} />
                  <button onClick={() => {const input = document.getElementById(`score-input-${p.id}`); if(input){const val = parseInt(input.value)||0; updateScore(p.id, val); input.value=0;}}} className="px-2 py-1 bg-green-500 text-white rounded text-sm">Dodaj</button>
                  <button onClick={() => removePlayer(p.id)} className="px-2 py-1 bg-red-400 text-white rounded text-sm" title="Usuń gracza">Usuń</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">Tip: kliknij kropkę obok gracza lub kulę na okręgu, aby rozpocząć jego ruch. Maksymalnie 9 graczy.</div>
    </div>
  );
}
