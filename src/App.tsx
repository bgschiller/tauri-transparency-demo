import { MouseEvent, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

const PointerMode = {
  isCaptured: false,
  captureMouseEvents() {
    invoke("set_ignore_mouse_events", { ignore: false, forward: false });
  },
  releaseMouseEvents() {
    invoke("set_ignore_mouse_events", { ignore: true, forward: true });
  },
  releaseMouseEventsIfOutside(e: MouseEvent) {
    // On Windows, when we synthetically forward WM_MOUSEMOVE events to the webview window, the
    // Webview2 class calls TrackMouseEvent to ask the operating system to tell it when the mouse
    // leaves the window. Since a different window is focused, the operating system says "It's
    // already left!", and Webview2 triggers a `mouseleave` event[1]. This happens on every
    // WM_MOUSEMOVE event, so we end up with a flickering effect where the webview is constantly
    // toggling its ability to be clicked-through. You can see this most easily by setting a :hover
    // style on one of the clickable elements.

    // In our case, we don't want to consider the mouse to have left the clickable region when the
    // user is still hovering over it. If we did, we'd stop capturing mouse clicks and the user
    // wouldn't be able to interact with this element. To work around this, we check if the mouse is
    // still inside the clickable element before releasing the mouse events and allowing the webview
    // to be clicked-through again.

    // [1] This is usually a helpful thing for the browser to do: I want to get a `mouseleave` when
    //     the user focuses a different window without using a mouse, such as with Alt+Tab.
    const bbox = (e.target as HTMLElement).getBoundingClientRect();
    if (
      e.clientX >= bbox.left &&
      e.clientX <= bbox.right &&
      e.clientY >= bbox.top &&
      e.clientY <= bbox.bottom
    ) {
      // the mouse is still inside the element. This is one of those times.
      return;
    }
    PointerMode.releaseMouseEvents();
  },
};

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
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
      onMouseEnter={PointerMode.releaseMouseEvents}
      onMouseLeave={PointerMode.captureMouseEvents}
    >
      <h1>Welcome to Tauri!</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img
            src="/vite.svg"
            className="logo vite"
            alt="Vite logo"
            onMouseEnter={PointerMode.captureMouseEvents}
            onMouseLeave={PointerMode.releaseMouseEvents}
          />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img
            src="/tauri.svg"
            className="logo tauri"
            alt="Tauri logo"
            onMouseEnter={PointerMode.captureMouseEvents}
            onMouseLeave={PointerMode.releaseMouseEvents}
          />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img
            src={reactLogo}
            className="logo react"
            alt="React logo"
            onMouseEnter={PointerMode.captureMouseEvents}
            onMouseLeave={PointerMode.releaseMouseEvents}
          />
        </a>
        <svg width="600" height="200" xmlns="http://www.w3.org/2000/svg">
          <path
            id="wavyPath"
            d="M10,100 C50,150 150,50 200,100 S350,150 400,100 S550,50 590,100"
            fill="transparent"
            stroke={color.background}
            strokeWidth={40}
            onClick={() => setColorIndex((colorIndex) => colorIndex + 1)}
            onMouseEnter={PointerMode.captureMouseEvents}
            onMouseLeave={PointerMode.releaseMouseEvents}
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
          onMouseEnter={PointerMode.captureMouseEvents}
          onMouseLeave={PointerMode.releaseMouseEvents}
        />
        <button
          type="submit"
          onMouseEnter={PointerMode.captureMouseEvents}
          onMouseLeave={PointerMode.releaseMouseEvents}
        >
          Greet
        </button>
      </form>

      <p>{greetMsg}</p>
    </div>
  );
}

export default App;
