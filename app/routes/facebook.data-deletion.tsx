import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // Facebook sends a POST request with a signed_request parameter
  const formData = await request.formData();
  const signedRequest = formData.get("signed_request");

  if (!signedRequest) {
    return json({ error: "Missing signed_request parameter" }, { status: 400 });
  }

  try {
    // Here you would verify the signed_request from Facebook
    // For now, we'll just acknowledge the request
    return json({
      url: "https://www.taramind.vn/user/data-deletion",
      confirmation_code: "123456789"
    });
  } catch (error) {
    return json({ error: "Invalid request" }, { status: 400 });
  }
}; 