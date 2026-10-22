import { useGlobalAuthenticationStore as store } from "./index";

beforeEach(() => {
  localStorage.clear();
  store.getState().clearAuth();
});

it("persists only wallet metadata and restores the adapter after a refresh", async () => {
  await store.getState().connectWalletStore("GX", "LOBSTR", "lobstr");
  store.getState().setToken("NEVER_PERSIST_THIS");
  const saved = localStorage.getItem("safetrust-wallet")!;
  expect(JSON.parse(saved).state).toEqual({
    address: "GX",
    name: "LOBSTR",
    walletId: "lobstr",
  });
  expect(saved).not.toContain("NEVER_PERSIST_THIS");
  store.getState().clearAuth();
  localStorage.setItem("safetrust-wallet", saved);
  await store.persist.rehydrate();
  expect(store.getState()).toMatchObject({
    address: "GX",
    name: "LOBSTR",
    walletId: "lobstr",
    token: "",
  });
});

it("ignores injected tokens and store actions when hydrating browser-controlled data", async () => {
  localStorage.setItem(
    "safetrust-wallet",
    JSON.stringify({
      state: {
        address: "GX",
        name: "xBull",
        walletId: "xbull",
        token: "FORGED",
        setToken: "not a function",
      },
      version: 0,
    }),
  );
  await store.persist.rehydrate();
  expect(store.getState().token).toBe("");
  expect(typeof store.getState().setToken).toBe("function");
});
