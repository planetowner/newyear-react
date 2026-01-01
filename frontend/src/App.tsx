import { useRoutes } from "react-router-dom";

import { routes } from "./routes";
import { Popup } from "./popup/Popup";
import { BgCanvas } from "./components/BgCanvas/BgCanvas";

export function App() {
  const element = useRoutes(routes);

  return (
    <>
      {element}
      <Popup />
      <BgCanvas />
    </>
  );
}
