/**
 * Account Hooks — Re-exports from the service layer
 *
 * The canonical hooks live in @/api/services/accounts.
 * This file provides backward-compatible re-exports for any
 * code that already imports from @/hooks/accounts.
 */

export {
    useAccountList as useAccounts,
    useAccount,
    useAccountBalances,
    useCreateAccount,
    useUpdateAccount,
    useDeleteAccount,
} from '@/api/services/accounts';