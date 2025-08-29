import { supabase } from "@/config/client";

export async function getSignedImageUrl(id: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from("images")
    .createSignedUrl(`folder/${id}.jpg`, 60);

  return data?.signedUrl ?? null;
}