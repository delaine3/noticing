import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

test("account deletion is available through Settings, not an email request", () => {
  const menu = source("app/components/ProfileDropdown.tsx");
  const settings = source("app/settings/page.tsx");
  const deletion = source("app/api/account/delete/route.ts");
  const oldAccount = source("app/account/page.tsx");
  assert.match(menu, /href="\/settings"/);
  assert.ok(menu.indexOf('href="/settings"') < menu.indexOf("onLogout}"));
  assert.match(settings, /<DeleteAccountForm\s*\/>/);
  assert.match(oldAccount, /redirect\("\/settings"\)/);
  assert.match(deletion, /auth\.getUser\(\)/);
  assert.match(deletion, /signInWithPassword/);
  assert.match(deletion, /auth\.admin\.deleteUser\(user\.id\)/);
  assert.match(deletion, /process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(settings, /mailto:|request account closure/i);
});

test("no migration or server setup directions appear in customer screens", () => {
  const pages = [
    "app/journal/page.tsx",
    "app/journal/JournalDesk.tsx",
    "app/journal/actions.ts",
    "app/check-in/page.tsx",
    "app/coaching/settings/page.tsx",
    "app/coaching/settings/SettingsForm.tsx",
    "app/coaching/actions.ts",
    "app/import/chat/ChatImportReview.tsx",
  ];
  for (const page of pages) {
    const content = source(page);
    assert.doesNotMatch(content, /run the SQL migration|apply the Thought Garden SQL migration|has not been installed yet|configured on this server|the server must be configured/i, page);
  }
});

test("shared-demo password is not shipped in the login bundle", () => {
  const login = source("app/login/page.tsx");
  assert.doesNotMatch(login, /demoCredentials|D3m0Pa\$\$w0rd/);
});

test("export includes the journal, and the server controls user identity", () => {
  const exportRoute = source("app/api/account/export/route.ts");
  assert.match(exportRoute, /"journal_entries"/);
  assert.match(exportRoute, /"login_events"/);
  assert.match(exportRoute, /\.eq\(column, userId\)/);
});
