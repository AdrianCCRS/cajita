import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

const { authMock, spaDataMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  spaDataMock: vi.fn(),
}));

vi.mock("../shared/auth/AuthContext", () => ({
  useAuth: authMock,
}));

vi.mock("../shared/data/SpaDataContext", () => ({
  defaultTransactionDate: () => "2026-06-15",
  useSpaData: spaDataMock,
}));

describe("AppShell", () => {
  const updateThemeMode = vi.fn();

  beforeEach(() => {
    updateThemeMode.mockReset();
    authMock.mockReturnValue({
      isFirebaseEnabled: true,
      signOut: vi.fn(),
      user: { email: "duena@spa.com" },
    });
    spaDataMock.mockReturnValue({
      business: { id: "main", name: "Spa Mariela", currency: "COP" },
      isLoading: false,
      error: null,
      uiSettings: {
        appAccentColor: null,
        themeMode: "light",
      },
      updateThemeMode,
    });
  });

  function renderShell() {
    return render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AppShell />} path="/">
            <Route index element={<div>Inicio</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  }

  it("muestra el switch de modo oscuro dentro del dropdown", () => {
    renderShell();

    expect(screen.getByRole("switch", { name: "Modo oscuro" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /modo oscuro/i })).toBeNull();
  });

  it("guarda dark al activar el switch", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("switch", { name: "Modo oscuro" }));

    expect(updateThemeMode).toHaveBeenCalledWith("dark");
  });
});
