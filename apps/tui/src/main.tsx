#!/usr/bin/env bun
import { render } from "@opentui/solid";
import { App } from "./App.js";
import { ConsolePosition } from "@opentui/core";

function main() {
  render(() => <App />, {
    consoleOptions: {
      position: ConsolePosition.BOTTOM,
      sizePercent: 70,
    },
  });
}

main();
