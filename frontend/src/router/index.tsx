import { useRoutes } from "react-router-dom";
import Home from "../views/home/main";
import NotFound from "../views/not-found/main";
import Mint from "../views/mint/main";
import PlansPage from "../views/plans/main";
function Router() {
  const routes = [
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/plans",
      element: <PlansPage />,
    },
    {
      path: "/mint",
      element: <Mint />,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ];
  return useRoutes(routes);
}

export default Router;
