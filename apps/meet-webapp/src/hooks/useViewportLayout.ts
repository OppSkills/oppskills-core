"use client";

import { useEffect, useState } from "react";
import {
  getFilmstripPerPage,
  getMaxGridCols,
  getTilesPerPage,
} from "@/lib/meet/gridLayout";

export function useViewportLayout() {
  const [layout, setLayout] = useState({
    width: 1280,
    maxCols: 4,
    tilesPerPage: 16,
    filmstripPerPage: 8,
  });

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      setLayout({
        width,
        maxCols: getMaxGridCols(width),
        tilesPerPage: getTilesPerPage(width),
        filmstripPerPage: getFilmstripPerPage(width),
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return layout;
}
