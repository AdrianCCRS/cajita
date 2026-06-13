import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders Cajita", async () => {
    render(<App />);

    expect(await screen.findByText("Cajita")).toBeTruthy();
  });
});
