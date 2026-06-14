import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders Cajita", async () => {
    render(<App />);

    expect(await screen.findByText("Cajita")).toBeTruthy();
  });

  it("no muestra Calendario en el menú principal", async () => {
    render(<App />);

    expect(await screen.findByText("Cajita")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /calendario/i })).toBeNull();
  });
});
