import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { StatHUD } from "../StatHUD";

describe("StatHUD", () => {
  it("renders all stats", () => {
    render(<StatHUD energy={75} hunger={60} thirst={80} social={65} />);
    expect(screen.getByText("Energy")).toBeDefined();
    expect(screen.getByText("Hunger")).toBeDefined();
    expect(screen.getByText("Thirst")).toBeDefined();
    expect(screen.getByText("Social")).toBeDefined();
  });

  it("displays correct values", () => {
    render(<StatHUD energy={75} hunger={60} thirst={80} social={65} />);
    expect(screen.getByText("75")).toBeDefined();
    expect(screen.getByText("60")).toBeDefined();
    expect(screen.getByText("80")).toBeDefined();
    expect(screen.getByText("65")).toBeDefined();
  });
});
