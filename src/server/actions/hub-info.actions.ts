'use server';

import { revalidatePath } from 'next/cache';
import { requireHubAdmin } from '@/server/auth/guards';
import { HubInfoService } from '../services/hub-info.service';
import {
  updateHubGeneralSchema,
  updateHubBillingSchema,
  UpdateHubGeneralInput,
  UpdateHubBillingInput,
  UpdateHubStyleSettingsInput,
  updateHubStyleSettingsSchema,
} from '@/lib/validations/hub-info';
import { createClient } from '@/utils/supabase/server';

export async function updateHubStyleSettingsAction(
  slugHub: string,
  data: UpdateHubStyleSettingsInput
) {
  const parsed = updateHubStyleSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Dati non validi.' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('hubs')
    .update({
      has_products: parsed.data.has_products,
      has_dishes: parsed.data.has_dishes,
      has_services: parsed.data.has_services,
      type: parsed.data.type,
      palette: parsed.data.palette,
    })
    .eq('slug', slugHub);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateHubGeneralAction(slugHub: string, formData: UpdateHubGeneralInput) {
  try {
    // 1. Guard Security: Solo gli Admin possono modificare l'Hub
    const ctx = await requireHubAdmin(slugHub);

    // 2. Validazione Zod
    const validated = updateHubGeneralSchema.parse(formData);

    // 3. Esecuzione Service
    const updatedHub = await HubInfoService.updateGeneralInfo(ctx.hubId, validated);

    // 4. Revalidate della rotta per refresh immediato dei dati
    revalidatePath(`/dashboard/hubs/${slugHub}`);
    revalidatePath(`/dashboard/hubs/${updatedHub.slug}`);

    return { success: true, data: updatedHub, newSlug: updatedHub.slug };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore imprevisto' };
  }
}

export async function updateHubBillingAction(slugHub: string, formData: UpdateHubBillingInput) {
  try {
    const ctx = await requireHubAdmin(slugHub);
    const validated = updateHubBillingSchema.parse(formData);

    const updatedBilling = await HubInfoService.updateBillingInfo(ctx.hubId, validated);

    revalidatePath(`/dashboard/hubs/${slugHub}`);
    return { success: true, data: updatedBilling };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore imprevisto' };
  }
}