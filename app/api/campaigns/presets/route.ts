import { SEASON_PRESETS, resolveCampaignPresetDefaults } from "@/lib/document-campaign/presets";
import { successResponse } from "@/lib/api-response";

export async function GET() {
  const presets = SEASON_PRESETS.map((preset) => {
    const defaults = resolveCampaignPresetDefaults({
      seasonPresetId: preset.id,
    });
    return {
      id: preset.id,
      label: preset.label,
      taxType: preset.taxType,
      title: defaults.title,
      memo: defaults.memo,
      submissionDeadlineLabel: defaults.submissionDeadlineLabel,
      requestDateLabel: defaults.requestDateLabel,
    };
  });

  return successResponse({ presets });
}
