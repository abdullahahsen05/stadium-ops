import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("components/layout/topbar.tsx", "utf8");

assert.match(source, /LogOut/, "TopBar should import and render a logout icon");
assert.match(source, /function handleLogout\(\)/, "TopBar should define a logout handler");
assert.match(source, /demo_access=; path=\/; max-age=0; SameSite=Strict/, "Logout should clear the demo_access cookie");
assert.match(source, /router\.replace\("\/login"\)/, "Logout should redirect to the login page");
assert.match(source, />\s*Logout\s*</, "User dropdown should expose a Logout item");

console.log("topbar logout ok");
