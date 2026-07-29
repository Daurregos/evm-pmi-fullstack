import { type ChildProcess, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";

const baseUrl = "http://127.0.0.1:3100";
const mockPrefix = "/mock-api";

async function waitForServer(
  server: ChildProcess,
  instanceId: string,
): Promise<void> {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`Next exited before becoming ready (${server.exitCode})`);
    }

    try {
      const response = await fetch(`${baseUrl}${mockPrefix}/projects`);
      if (
        response.ok &&
        response.headers.get("x-mock-instance") === instanceId
      ) {
        return;
      }
    } catch {
      // Next is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error("Next did not become ready within 30 seconds");
}

async function waitForExit(
  child: ChildProcess,
  timeoutMilliseconds: number,
): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return true;
  }

  return Promise.race([
    once(child, "exit").then(() => true),
    new Promise<boolean>((resolve) =>
      setTimeout(() => resolve(false), timeoutMilliseconds),
    ),
  ]);
}

function signalProcessGroup(child: ChildProcess, signal: NodeJS.Signals): void {
  if (child.pid === undefined) {
    return;
  }

  try {
    process.kill(-child.pid, signal);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ESRCH"
    ) {
      throw error;
    }
  }
}

async function stopServer(server: ChildProcess): Promise<void> {
  signalProcessGroup(server, "SIGTERM");

  if (!(await waitForExit(server, 5_000))) {
    signalProcessGroup(server, "SIGKILL");
    await waitForExit(server, 5_000);
  }
}

async function main(): Promise<void> {
  const instanceId = randomUUID();
  const childEnvironment = {
    ...process.env,
    MOCK_INSTANCE_ID: instanceId,
  };
  const server = spawn(
    "npm",
    ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3100"],
    {
      detached: true,
      env: {
        ...childEnvironment,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: "inherit",
    },
  );

  let exitCode = 1;
  let stopPromise: Promise<void> | undefined;
  let handlingSignal = false;
  const stopServerOnce = (): Promise<void> => {
    stopPromise ??= stopServer(server);
    return stopPromise;
  };
  const handleSignal = (exitCodeForSignal: number): void => {
    if (handlingSignal) {
      return;
    }

    handlingSignal = true;
    void stopServerOnce().then(
      () => process.exit(exitCodeForSignal),
      (error: unknown) => {
        console.error(error);
        process.exit(exitCodeForSignal);
      },
    );
  };
  const handleSigint = (): void => handleSignal(130);
  const handleSigterm = (): void => handleSignal(143);

  process.once("SIGINT", handleSigint);
  process.once("SIGTERM", handleSigterm);

  try {
    await waitForServer(server, instanceId);

    const tests = spawn(
      process.execPath,
      [
        "--import",
        "tsx",
        "--test",
        "--test-concurrency=1",
        "tests/contract/mock-http.test.ts",
        "tests/contract/http-surface-structure.test.ts",
        "tests/contract/real-http.test.ts",
      ],
      { env: childEnvironment, stdio: "inherit" },
    );
    const [testExitCode] = (await once(tests, "exit")) as [
      number | null,
      NodeJS.Signals | null,
    ];
    exitCode = testExitCode ?? 1;
  } catch (error) {
    console.error(error);
  } finally {
    await stopServerOnce();
    process.off("SIGINT", handleSigint);
    process.off("SIGTERM", handleSigterm);
  }

  process.exitCode = exitCode;
}

void main();
