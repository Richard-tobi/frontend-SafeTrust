import { fireEvent, render, screen } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail } from "firebase/auth";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { auth } from "@/lib/firebase";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/lib/firebase", () => ({ auth: { name: "mock-auth" } }));
jest.mock("firebase/auth", () => ({ sendPasswordResetEmail: jest.fn() }));
jest.mock("@/components/auth/ui/Buildings", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/ui/ThemeToggle", () => ({ ThemeToggle: () => null }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

function submit() {
  render(<ForgotPasswordForm />);
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "unknown@safetrust.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send password" }));
}

it.each([
  ["auth/user-not-found", "No account found with this email"],
  ["auth/too-many-requests", "Too many requests. Please try again later"],
])("shows the mapped Firebase message for %s", async (code, message) => {
  jest
    .mocked(sendPasswordResetEmail)
    .mockRejectedValueOnce(new FirebaseError(code, "Reset failed"));
  submit();
  expect(await screen.findByText(message)).toBeInTheDocument();
  expect(sendPasswordResetEmail).toHaveBeenCalledWith(
    auth,
    "unknown@safetrust.test",
  );
  expect(screen.getByRole("button", { name: "Send password" })).toBeEnabled();
});

it.each([
  new FirebaseError("auth/unrecognized-error", "Unexpected"),
  new Error("Unexpected"),
  { code: "auth/user-not-found" },
  null,
])(
  "uses the fallback for unsupported or non-Firebase errors (%p)",
  async (error) => {
    jest.mocked(sendPasswordResetEmail).mockRejectedValueOnce(error);
    submit();
    expect(
      await screen.findByText("Something went wrong — please try again"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send password" })).toBeEnabled();
  },
);

it("shows reset instructions when Firebase succeeds without disclosing whether an account exists", async () => {
  jest.mocked(sendPasswordResetEmail).mockResolvedValueOnce(undefined);
  submit();
  expect(
    await screen.findByText("Check your email for reset instructions"),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toHaveValue("");
});
