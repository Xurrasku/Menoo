const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const apiDir = __dirname;
const isWindows = process.platform === "win32";
const markerPath = path.join(apiDir, ".venv", ".installed");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: apiDir,
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.error) {
    return { ok: false, error: result.error };
  }

  return { ok: result.status === 0, status: result.status, signal: result.signal };
}

function isInterruptedProcess(status, signal) {
  // Windows CTRL+C propagated from child process can surface as 0xC000013A.
  if (status === 3221225786) {
    return true;
  }
  return signal === "SIGINT" || signal === "SIGTERM";
}

function detectPython() {
  const candidates = isWindows
    ? [
        ["py", ["-3", "--version"]],
        ["python", ["--version"]],
      ]
    : [
        ["python3", ["--version"]],
        ["python", ["--version"]],
      ];

  for (const [cmd, args] of candidates) {
    const check = spawnSync(cmd, args, { cwd: apiDir, stdio: "ignore", shell: false });
    if (check.status === 0) {
      return cmd;
    }
  }

  return null;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const pythonCmd = detectPython();
if (!pythonCmd) {
  fail("Python no encontrado. Instala Python 3 y vuelve a ejecutar el comando.");
}

const venvPython = isWindows
  ? path.join(apiDir, ".venv", "Scripts", "python.exe")
  : path.join(apiDir, ".venv", "bin", "python");

if (!fs.existsSync(venvPython)) {
  console.log("Creating virtual environment...");
  const createVenvArgs = pythonCmd === "py" ? ["-3", "-m", "venv", ".venv"] : ["-m", "venv", ".venv"];
  const createVenv = run(pythonCmd, createVenvArgs);
  if (!createVenv.ok) {
    fail("No se pudo crear el entorno virtual .venv");
  }
}

if (!fs.existsSync(markerPath)) {
  console.log("Installing dependencies...");
  if (!run(venvPython, ["-m", "pip", "install", "--upgrade", "pip"]).ok) {
    fail("Fallo al actualizar pip");
  }

  if (!run(venvPython, ["-m", "pip", "install", "-r", "requirements.txt"]).ok) {
    fail("Fallo al instalar requirements.txt");
  }

  fs.writeFileSync(markerPath, "", "utf8");
}

console.log("Starting FastAPI server on http://localhost:8000");
const uvicorn = run(venvPython, ["-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"], {
  env: { ...process.env, PORT: "8000" },
});

if (isInterruptedProcess(uvicorn.status, uvicorn.signal)) {
  process.exit(0);
}

process.exit(uvicorn.status ?? 1);
