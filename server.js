const express = require("express");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// Friendly paths for the static authentication and dashboard pages.
app.get("/login", (_req, res) => res.sendFile("login.html", { root: "public" }));
app.get("/admin", (_req, res) => res.sendFile("admin.html", { root: "public" }));

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Server running at ${url}`);

  // Only open a browser for local development, never on a hosted server.
  if (process.env.PORT) return;

  // Open the site in the user's default browser when the server starts.
  const browserCommand = process.platform === "win32"
    ? "cmd"
    : process.platform === "darwin"
      ? "open"
      : "xdg-open";
  const browserArgs = process.platform === "win32"
    ? ["/c", "start", "", url]
    : [url];

  const browser = spawn(browserCommand, browserArgs, {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });
  browser.on("error", (error) => {
    console.error(`Could not open the browser automatically: ${error.message}`);
    console.log(`Open ${url} in your browser.`);
  });
  browser.unref();
});
