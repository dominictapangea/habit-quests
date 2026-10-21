// `npm test` in the repository root: installs dependencies when missing, then
// runs the API tests (including the recording replay) and the UI tests.
import { checkNode, installIfMissing, run } from "./setup.mjs";

checkNode();
installIfMissing();
run("api", "npm test");
run("web", "npm test");
