import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return json({ error: "File must be an image" }, { status: 400 });
  }

  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const supabase = createSupabaseServerClient(request);

    // Upload file to Supabase storage
    const { data, error } = await supabase.client.storage
      .from("taramind")
      .upload(`${Date.now()}-${file.name}`, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.client.storage
      .from("taramind")
      .getPublicUrl(data.path);

    return json({ 
      success: 1, 
      file: { 
        url: publicUrl 
      } 
    });
  } catch (error) {
    console.error("Upload error:", error);
    return json({ error: "Upload failed" }, { status: 500 });
  }
}; 