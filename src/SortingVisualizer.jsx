import React, { useState, useRef, useEffect } from "react";
import "./SortingVisualizer.css";

export default function SortingVisualizer() {
  const [array, setArray] = useState([]);
  const [size, setSize] = useState(12);
  const [speed, setSpeed] = useState(300);
  const [algorithm, setAlgorithm] = useState("bubble");
  const [running, setRunning] = useState(false);
  const [highlights, setHighlights] = useState({});
  const stepsRef = useRef([]);
  const stepIndexRef = useRef(0);
  const timerRef = useRef(null);

  const randomArray = (n) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 90) + 10);

  useEffect(() => {
    setArray(randomArray(size));
  }, [size]);

  const recordStep = (type, payload) => {
    stepsRef.current.push({ type, payload });
  };

  const genBubble = (arr) => {
    const a = arr.slice();
    stepsRef.current = [];
    const n = a.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - 1 - i; j++) {
        recordStep("compare", { i: j, j: j + 1 });
        if (a[j] > a[j + 1]) {
          recordStep("swap", { i: j, j: j + 1 });
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          recordStep("array", { array: a.slice() });
        }
      }
      recordStep("markSorted", { idx: n - 1 - i });
    }
    recordStep("done", {});
  };

  const genInsertion = (arr) => {
    const a = arr.slice();
    stepsRef.current = [];
    const n = a.length;
    for (let i = 1; i < n; i++) {
      let key = a[i];
      let j = i - 1;
      recordStep("select", { idx: i });
      while (j >= 0 && a[j] > key) {
        recordStep("compare", { i: j, j: j + 1 });
        a[j + 1] = a[j];
        recordStep("overwrite", { idx: j + 1, value: a[j] });
        recordStep("array", { array: a.slice() });
        j--;
      }
      a[j + 1] = key;
      recordStep("insert", { idx: j + 1, value: key });
      recordStep("array", { array: a.slice() });
    }
    recordStep("done", {});
  };

  const genQuick = (arr) => {
    const a = arr.slice();
    stepsRef.current = [];

    const partition = (l, r) => {
      const pivot = a[r];
      let i = l;
      recordStep("pivot", { idx: r });
      for (let j = l; j < r; j++) {
        recordStep("compare", { i: j, j: r });
        if (a[j] < pivot) {
          recordStep("swap", { i: i, j: j });
          [a[i], a[j]] = [a[j], a[i]];
          recordStep("array", { array: a.slice() });
          i++;
        }
      }
      recordStep("swap", { i: i, j: r });
      [a[i], a[r]] = [a[r], a[i]];
      recordStep("array", { array: a.slice() });
      return i;
    };

    const quick = (l, r) => {
      if (l >= r) return;
      const p = partition(l, r);
      recordStep("markSorted", { idx: p });
      quick(l, p - 1);
      quick(p + 1, r);
    };

    quick(0, a.length - 1);
    recordStep("done", {});
  };

  const generateSteps = () => {
    const arr = array.slice();
    if (algorithm === "bubble") genBubble(arr);
    else if (algorithm === "insertion") genInsertion(arr);
    else if (algorithm === "quick") genQuick(arr);
    stepIndexRef.current = 0;
  };

  const play = () => {
    if (running) return;
    generateSteps();
    setRunning(true);
    runNextStep();
  };

  const pause = () => {
    setRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const reset = () => {
    pause();
    setArray(randomArray(size));
    stepsRef.current = [];
    stepIndexRef.current = 0;
    setHighlights({});
  };

  const runNextStep = () => {
    const steps = stepsRef.current;
    if (stepIndexRef.current >= steps.length) {
      setRunning(false);
      return;
    }
    const step = steps[stepIndexRef.current++];
    applyStep(step);
    if (running) {
      timerRef.current = setTimeout(runNextStep, Math.max(10, speed));
    }
  };

  const applyStep = (step) => {
    switch (step.type) {
      case "compare": {
        const { i, j } = step.payload;
        setHighlights({ [i]: "compare", [j]: "compare" });
        break;
      }
      case "swap": {
        const { i, j } = step.payload;
        setHighlights({ [i]: "swap", [j]: "swap" });
        setArray((prev) => {
          const copy = prev.slice();
          [copy[i], copy[j]] = [copy[j], copy[i]];
          return copy;
        });
        break;
      }
      case "array":
        setArray(step.payload.array.slice());
        setHighlights({});
        break;
      case "overwrite": {
        const { idx, value } = step.payload;
        setArray((prev) => {
          const copy = prev.slice();
          copy[idx] = value;
          return copy;
        });
        setHighlights({ [idx]: "overwrite" });
        break;
      }
      case "insert":
        setHighlights({ [step.payload.idx]: "insert" });
        break;
      case "select":
        setHighlights({ [step.payload.idx]: "select" });
        break;
      case "pivot":
        setHighlights({ [step.payload.idx]: "pivot" });
        break;
      case "markSorted":
        setHighlights((s) => ({ ...s, [step.payload.idx]: "sorted" }));
        break;
      case "done":
        setHighlights({});
        setRunning(false);
        break;
      default:
        setHighlights({});
    }
  };

  return (
    <div className="container">
      <h1>Sorting Algorithm Visualizer</h1>

      <div className="controls">
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          disabled={running}
        >
          <option value="bubble">Bubble Sort</option>
          <option value="insertion">Insertion Sort</option>
          <option value="quick">Quick Sort</option>
        </select>

        <label>
          Size:
          <input
            type="range"
            min={5}
            max={24}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            disabled={running}
          />
          {size}
        </label>

        <label>
          Speed:
          <input
            type="range"
            min={20}
            max={1000}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          {speed}ms
        </label>

        <button onClick={reset} disabled={running}>Randomize</button>
        {!running ? (
          <button onClick={play}>Start</button>
        ) : (
          <button onClick={pause}>Pause</button>
        )}
      </div>

      <div className="array-container">
        {array.map((v, idx) => (
          <div
            key={idx}
            className={`array-item ${highlights[idx] || ""}`}
          >
            <div className="index">{idx}</div>
            <div className="value">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
