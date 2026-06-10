import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders Spa Control", async () => {
    render(<App />);

    expect(await screen.findByText("Spa Control")).toBeTruthy();
  });
});
