import type { RouteObject } from "react-router-dom";

import Landing from "./pages/Landing/Landing";
import Editor from "./pages/Editor/Editor";
import CardViewer from "./pages/CardViewer/CardViewer";
import NotFound from "./pages/NotFound/NotFound";

export const routes: RouteObject[] = [
  { path: "/", element: <Landing /> },
  { path: "/editor", element: <Editor /> },
  { path: "/card/:id/preview", element: <CardViewer /> },
  { path: "/card/:id", element: <CardViewer /> },
  { path: "/404", element: <NotFound /> },
  { path: "*", element: <NotFound /> },
];
