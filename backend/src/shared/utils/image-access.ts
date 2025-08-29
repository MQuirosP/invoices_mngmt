import { supabase } from "../../config/client";

export async function getSignedImageUrl(id: string): Promise<string | null> {
  // Supabase example
  const { data, error } = await supabase.storage
    .from("images")
    .createSignedUrl(`folder/${id}.jpg`, 60); // 60s de validez

  return data?.signedUrl ?? null;
}