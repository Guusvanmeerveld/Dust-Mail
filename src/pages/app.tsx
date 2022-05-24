import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import useLocalStorageState from "use-local-storage-state";

import useTheme from "@utils/hooks/useTheme";
import Index from "./Index";
import Login from "./Login";

const App = () => {
  const theme = useTheme();

  const [isLoggedIn] = useLocalStorageState("isLoggedIn", {
    defaultValue: false,
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isLoggedIn && <Index />}
      {!isLoggedIn && <Login />}
    </ThemeProvider>
  );
};

export default App;
