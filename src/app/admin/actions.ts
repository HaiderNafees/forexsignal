"use server";

import {
  adminAssistedSignalManagement,
  type AdminAssistedSignalManagementInput,
} from "@/ai/flows/admin-assisted-signal-management";
import { z } from "zod";

const inputSchema = z.object({
  taskType: z.enum(['suggestNewSignals', 'summarizeImpact']),
  marketTrends: z.string().optional(),
  existingSignals: z.string().optional(),
  userGroups: z.string().optional(),
});

export async function generateSuggestions(
  prevState: any,
  formData: FormData
) {
  const rawData = {
    taskType: formData.get("taskType"),
    marketTrends: formData.get("marketTrends"),
    existingSignals: formData.get("existingSignals"),
    userGroups: formData.get("userGroups"),
  };

  const validatedFields = inputSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      suggestion: null,
    };
  }

  try {
    const result = await adminAssistedSignalManagement(validatedFields.data as AdminAssistedSignalManagementInput);
    return { message: "success", suggestion: result.suggestions };
  } catch (error) {
    console.error("AI suggestion failed:", error);
    return { message: "An error occurred while generating suggestions.", suggestion: null };
  }
}
