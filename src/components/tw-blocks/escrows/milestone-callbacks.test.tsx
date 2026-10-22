import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { SendTransactionResponse } from "@trustless-work/escrow/types";
import { ApproveMilestone } from "./multi-release/approve-milestone/ApproveMilestone";
import { ChangeMilestoneStatus } from "./multi-release/change-milestone-status/ChangeMilestoneStatus";
import { toast } from "sonner";

const mockMutateAsync = jest.fn();
jest.mock("@/components/tw-blocks/tanstack/useEscrowsMutations", () => ({
  useEscrowsMutations: () => ({
    approveMilestone: { mutateAsync: mockMutateAsync },
    changeMilestoneStatus: { mutateAsync: mockMutateAsync },
  }),
}));
jest.mock("@/components/tw-blocks/wallet-kit/WalletProvider", () => ({
  useWalletContext: () => ({ walletAddress: "GCONNECTED" }),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

describe.each(["approve", "change status"] as const)(
  "%s callback",
  (action) => {
    const metadata = { bookingId: "booking-123" };
    function renderAction(onSuccess: (data: SendTransactionResponse) => void) {
      return render(
        action === "approve" ? (
          <ApproveMilestone
            contractId="C123"
            milestoneId={2}
            approverWallet="GAPPROVER"
            customMetadata={metadata}
            onSuccess={onSuccess}
          />
        ) : (
          <ChangeMilestoneStatus
            contractId="C123"
            milestoneId={2}
            newStatus="completed"
            walletAddress="GPROVIDER"
            customMetadata={metadata}
            onSuccess={onSuccess}
          />
        ),
      );
    }

    it("passes the confirmed transaction response and metadata, rather than the request payload", async () => {
      const response: SendTransactionResponse = {
        status: "SUCCESS",
        message: "Confirmed",
      };
      mockMutateAsync.mockResolvedValueOnce(response);
      const onSuccess = jest.fn<void, [SendTransactionResponse]>();
      renderAction(onSuccess);
      fireEvent.click(screen.getByRole("button"));
      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
      expect(onSuccess).toHaveBeenCalledWith({
        ...response,
        customMetadata: metadata,
      });
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "multi-release",
          payload: expect.objectContaining({
            contractId: "C123",
            milestoneIndex: "2",
          }),
        }),
      );
      expect(screen.getByRole("button")).toBeEnabled();
    });

    it("does not call onSuccess when the mutation fails", async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error("Signature rejected"));
      const onSuccess = jest.fn<void, [SendTransactionResponse]>();
      renderAction(onSuccess);
      fireEvent.click(screen.getByRole("button"));
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Signature rejected"),
      );
      expect(onSuccess).not.toHaveBeenCalled();
      expect(screen.getByRole("button")).toBeEnabled();
    });
  },
);
