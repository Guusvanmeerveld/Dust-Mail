import { TargetedEvent } from "preact/compat";

import Box from "@mui/material/Box";
import Input from "@mui/material/Input";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import useLocalStorageState from "use-local-storage-state";
import Stack from "@mui/material/Stack";

const Login = () => {
  const [username, setUsername] = useLocalStorageState("username");

  const onSubmit = (e: TargetedEvent) => {
    e.preventDefault();

    console.log("je moeder");
  };

  return (
    <>
      <Box sx={{ textAlign: "center", width: "20rem", m: "auto" }}>
        <form onSubmit={onSubmit}>
          <Stack direction="column" spacing={2}>
            <Typography variant="h2">
              {import.meta.env.VITE_APP_NAME}
            </Typography>
            <TextField
              required
              id="username"
              label="Email address"
              variant="outlined"
              type="email"
            />

            <TextField
              required
              id="password"
              label="Password"
              variant="outlined"
              type="password"
            />

            <Input type="submit" value="Login" />
          </Stack>
        </form>
      </Box>
    </>
  );
};

export default Login;
