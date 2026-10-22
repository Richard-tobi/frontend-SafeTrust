import type { ReactElement, ReactNode } from "react";
import { useEffect } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useGlobalAuthenticationStore } from "@/core/store/data";

type AuthUser = {
  address: string;
  name: string;
  token?: string;
};

type Options = Omit<RenderOptions, "wrapper"> & {
  authUser?: AuthUser;
};

type AuthSnapshot = Pick<
  ReturnType<typeof useGlobalAuthenticationStore.getState>,
  "address" | "name" | "token"
>;

type AuthRender = {
  id: number;
  authUser: AuthUser;
  previousAuth: AuthSnapshot;
};

const activeAuthRenders = new Map<number, AuthRender>();
let nextAuthRenderId = 0;
let originalAuth: AuthSnapshot | null = null;

function setAuth(auth: AuthSnapshot) {
  useGlobalAuthenticationStore.setState(auth);
}

function applyAuthUser(authUser: AuthUser) {
  setAuth({
    address: authUser.address,
    name: authUser.name,
    token: authUser.token ?? "",
  });
}

function restoreAuthForActiveRender() {
  const owner = [...activeAuthRenders.values()].reduce<AuthRender | null>(
    (latest, candidate) =>
      latest === null || candidate.id > latest.id ? candidate : latest,
    null,
  );

  if (owner) {
    applyAuthUser(owner.authUser);
    return;
  }

  if (originalAuth) {
    setAuth(originalAuth);
    originalAuth = null;
  }
}

function activateAuthRender(registration: AuthRender) {
  if (!activeAuthRenders.has(registration.id)) {
    if (activeAuthRenders.size === 0) {
      originalAuth = registration.previousAuth;
    }
    activeAuthRenders.set(registration.id, registration);
  }
  restoreAuthForActiveRender();
}

function deactivateAuthRender(registration: AuthRender) {
  if (activeAuthRenders.delete(registration.id)) {
    restoreAuthForActiveRender();
  }
}

export function renderWithProviders(
  ui: ReactElement,
  { authUser, ...options }: Options = {},
) {
  const previousAuth = useGlobalAuthenticationStore.getState();
  const authRegistration = authUser
    ? {
        id: nextAuthRenderId++,
        authUser,
        previousAuth: originalAuth ?? {
          address: previousAuth.address,
          name: previousAuth.name,
          token: previousAuth.token,
        },
      }
    : null;

  if (authRegistration) {
    activateAuthRender(authRegistration);
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    useEffect(() => {
      if (authRegistration) {
        activateAuthRender(authRegistration);
      }
      return () => {
        if (authRegistration) {
          deactivateAuthRender(authRegistration);
        }
        queryClient.clear();
      };
    }, []);

    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ThemeProvider>
    );
  }

  try {
    return render(ui, { wrapper: Wrapper, ...options });
  } catch (error) {
    queryClient.clear();
    if (authRegistration) {
      deactivateAuthRender(authRegistration);
    }
    throw error;
  }
}
