import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

const vite = await createServer({ appType:"custom", configFile:false, root:new URL("..",import.meta.url).pathname, resolve:{alias:{"@":new URL("..",import.meta.url).pathname}}, server:{middlewareMode:true} });
test.after(async()=>vite.close());

test("converts ISO dates and Unix timestamps", async()=>{
  const {parseDateValue,dateFormats}=await vite.ssrLoadModule("/lib/developer-tools.ts");
  assert.equal(dateFormats(parseDateValue("1970-01-01T00:00:01Z","iso")).seconds,"1");
  assert.equal(parseDateValue("1000","milliseconds").toISOString(),"1970-01-01T00:00:01.000Z");
  assert.throws(()=>parseDateValue("not-a-date","iso"),/valid/);
});

test("password generator includes required character groups", async()=>{
  const {generatePassword}=await vite.ssrLoadModule("/lib/developer-tools.ts");
  let n=0;const password=generatePassword(16,true,max=>(n++)%max);
  assert.equal(password.length,16);
  assert.match(password,/[a-z]/);assert.match(password,/[A-Z]/);assert.match(password,/[0-9]/);assert.match(password,/[!@#$%^&*_+=-]/);
});
