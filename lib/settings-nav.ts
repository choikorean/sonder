export const SETTINGS_LINKS = [
  { href: "/settings", label: "일반 설정" },
  { href: "/settings/team", label: "팀 관리" },
  { href: "/billing", label: "요금제" },
  { href: "/settings/billing", label: "결제 및 구독", requiresBillingManager: true },
] as const;

export function getSettingsLinks(canManageBilling: boolean) {
  return SETTINGS_LINKS.filter((item) => {
    if ("requiresBillingManager" in item && item.requiresBillingManager) {
      return canManageBilling;
    }
    return true;
  });
}
