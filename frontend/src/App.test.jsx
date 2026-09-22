import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

test("shows the Lumen Vault landing proposition", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: /your files,/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /enter your vault/i })).toBeInTheDocument();
});
