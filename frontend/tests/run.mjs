import {build} from "esbuild";
import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
const dir = await mkdtemp(join(tmpdir(), "smart-port-tests-"));
try {
  const out = join(dir,"tests.mjs");
  await build({entryPoints:["tests/integration.test.ts"], outfile:out, bundle:true, platform:"node", format:"esm",
    define:{"import.meta.env": JSON.stringify({VITE_USE_MOCK_API:"false", VITE_API_URL:"http://test/api/v1"})}});
  await import(pathToFileURL(out));
} finally { await rm(dir, {recursive:true, force:true}); }
