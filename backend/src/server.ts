import { validateEnvVars } from "@/config/validateEnv";
import app from "./app";

validateEnvVars();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
