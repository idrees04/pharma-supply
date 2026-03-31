/**
 * Account Hooks — Re-exports from the canonical service layer
 *
 * The canonical hooks live in @/api/services/accounts.
 * This file provides backward-compatible re-exports for any
 * code that already imports from @/hooks/accounts.
 */

export {
    // Query hooks
    useAccountList,
    useAccountList as useAccounts,
    useAccount,
    useAccountBalances,
    // Mutation hooks
    useCreateAccount,
    useUpdateAccount,
    useDeleteAccount,
    // Query keys
    accountKeys,
} from '@/api/services/accounts';