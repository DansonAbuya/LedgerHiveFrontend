/**
 * Pure formatting helpers for credit/repayment display. Not a server module.
 */
export function formatRepaymentLabel(
  repaymentType?: string | null,
  numberOfInstallments?: number | null
): string {
  if (repaymentType === 'INSTALLMENTS' && numberOfInstallments != null && numberOfInstallments > 0) {
    return `${numberOfInstallments} installment${numberOfInstallments !== 1 ? 's' : ''}`;
  }
  return 'One-off';
}
