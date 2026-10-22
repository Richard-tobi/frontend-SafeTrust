import { useGlobalAuthenticationStore } from "@/core/store/data";
import { renderWithProviders } from "@/test/render";

const originalAuth = {
  address: "original-wallet",
  name: "Original User",
  token: "original-token",
};

function AuthProbe() {
  const name = useGlobalAuthenticationStore((state) => state.name);
  return <span>{name}</span>;
}

describe("renderWithProviders", () => {
  beforeEach(() => {
    useGlobalAuthenticationStore.setState(originalAuth);
  });

  it("seeds the auth store and restores it when unmounted", () => {
    const view = renderWithProviders(<AuthProbe />, {
      authUser: {
        address: "test-wallet",
        name: "Test User",
      },
    });

    expect(view.getByText("Test User")).toBeInTheDocument();

    view.unmount();

    expect(useGlobalAuthenticationStore.getState()).toMatchObject(originalAuth);
  });

  it("keeps auth seeded through Strict Mode's effect cycle", () => {
    const view = renderWithProviders(<AuthProbe />, {
      authUser: {
        address: "strict-wallet",
        name: "Strict User",
      },
      reactStrictMode: true,
    });

    expect(view.getByText("Strict User")).toBeInTheDocument();

    view.unmount();

    expect(useGlobalAuthenticationStore.getState()).toMatchObject(originalAuth);
  });

  it("restores the original auth after overlapping renders unmount out of order", () => {
    const first = renderWithProviders(<AuthProbe />, {
      authUser: {
        address: "first-wallet",
        name: "First User",
      },
    });
    const second = renderWithProviders(<AuthProbe />, {
      authUser: {
        address: "second-wallet",
        name: "Second User",
      },
    });

    first.unmount();
    expect(useGlobalAuthenticationStore.getState().name).toBe("Second User");

    second.unmount();
    expect(useGlobalAuthenticationStore.getState()).toMatchObject(originalAuth);
  });

  it("restores the remaining render's auth when the latest render unmounts first", () => {
    const first = renderWithProviders(<AuthProbe />, {
      authUser: {
        address: "first-wallet",
        name: "First User",
      },
    });
    const second = renderWithProviders(<AuthProbe />, {
      authUser: {
        address: "second-wallet",
        name: "Second User",
      },
    });

    second.unmount();
    expect(useGlobalAuthenticationStore.getState().name).toBe("First User");

    first.unmount();
    expect(useGlobalAuthenticationStore.getState()).toMatchObject(originalAuth);
  });
});
