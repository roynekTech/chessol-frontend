import { Routes, Route } from "react-router-dom";
import { TournamentPage } from "./TournamentPage";

export function TournamentRouter() {
  return (
    <Routes>
      <Route index element={<TournamentPage />} />
      <Route path=":uniqueHash" element={<TournamentPage />} />
    </Routes>
  );
}
