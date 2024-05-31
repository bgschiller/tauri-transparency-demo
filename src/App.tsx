import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  function captureMouseEvents() {
    invoke("set_ignore_mouse_events", { ignore: false, forward: false });
  }

  function releaseMouseEvents() {
    invoke("set_ignore_mouse_events", { ignore: true, forward: true });
  }

  const colors = [
    { background: "black", text: "white" },
    { background: "white", text: "black" },
    { background: "red", text: "white" },
    { background: "green", text: "white" },
    { background: "blue", text: "white" },
    { background: "yellow", text: "black" },
    { background: "purple", text: "white" },
    { background: "orange", text: "black" },
    { background: "pink", text: "black" },
    { background: "brown", text: "white" },
    { background: "gray", text: "white" },
  ];
  const [colorIndex, setColorIndex] = useState(0);
  const color = colors[colorIndex % colors.length];

  return (
    <div
      className="container"
      // Note! these ones are backwards from the rest
      onMouseEnter={releaseMouseEvents}
      onMouseLeave={captureMouseEvents}
    >
      <h1>Welcome to Tauri!</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img
            src="/vite.svg"
            className="logo vite"
            alt="Vite logo"
            onMouseEnter={captureMouseEvents}
            onMouseLeave={releaseMouseEvents}
          />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img
            src="/tauri.svg"
            className="logo tauri"
            alt="Tauri logo"
            onMouseEnter={captureMouseEvents}
            onMouseLeave={releaseMouseEvents}
          />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img
            src={reactLogo}
            className="logo react"
            alt="React logo"
            onMouseEnter={captureMouseEvents}
            onMouseLeave={releaseMouseEvents}
          />
        </a>
        <svg width="600" height="200" xmlns="http://www.w3.org/2000/svg">
          <path
            id="wavyPath"
            d="M10,100 C50,150 150,50 200,100 S350,150 400,100 S550,50 590,100"
            fill="transparent"
            stroke={color.background}
            strokeWidth={40}
            onClick={() => setColorIndex(colorIndex + 1)}
            onMouseEnter={captureMouseEvents}
            onMouseLeave={releaseMouseEvents}
          />

          <text
            font-family="Arial"
            font-size="20"
            fill={color.text}
            dy="5"
            className="wavy-text"
          >
            <textPath href="#wavyPath" startOffset="5%">
              works with non-rectangular regions!
            </textPath>
          </text>
        </svg>
      </div>

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
          onMouseEnter={captureMouseEvents}
          onMouseLeave={releaseMouseEvents}
        />
        <button
          type="submit"
          onMouseEnter={captureMouseEvents}
          onMouseLeave={releaseMouseEvents}
        >
          Greet
        </button>
      </form>

      <p>{greetMsg}</p>
    </div>
  );
}

export default App;
