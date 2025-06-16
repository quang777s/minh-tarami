import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { createServiceRoleClient } from "~/lib/supabase/supabase.service.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type");

  if (!code) {
    return redirect("/login?error=No verification code provided");
  }

  const supabase = createSupabaseServerClient(request);

  try {
    if (type === "signup") {
      // Handle email verification
      const { data: { session }, error: sessionError } = await supabase.client.auth.exchangeCodeForSession(code);

      if (sessionError) {
        console.error("Email verification error:", sessionError);
        return redirect("/login?error=Email verification failed. Please try again or contact support.");
      }

      if (session?.user) {
        try {
          // Check if profile exists
          const serviceClient = createServiceRoleClient();
          const { data: existingProfile, error: profileCheckError } = await serviceClient
            .from("profiles")
            .select("id")
            .eq("user_id", session.user.id)
            .single();

          if (profileCheckError && profileCheckError.code !== "PGRST116") { // PGRST116 is "no rows returned"
            console.error("Profile check error:", profileCheckError);
            return redirect("/login?error=Failed to check user profile. Please contact support.");
          }

          // Create profile if it doesn't exist
          if (!existingProfile) {
            const { error: profileError } = await serviceClient
              .from("profiles")
              .insert([
                {
                  user_id: session.user.id,
                  email: session.user.email,
                  role: "customer",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  phone: null
                },
              ]);

            if (profileError) {
              console.error("Profile creation error:", profileError);
              return redirect("/login?error=Failed to create user profile. Please contact support.");
            }
          }

          // Update user's email_confirmed_at
          const { error: updateError } = await serviceClient
            .from("profiles")
            .update({ email_confirmed_at: new Date().toISOString() })
            .eq("user_id", session.user.id);

          if (updateError) {
            console.error("Failed to update email_confirmed_at:", updateError);
          }

          return redirect("/login?message=Email verified successfully. You can now log in.");
        } catch (error) {
          console.error("Unexpected error during profile handling:", error);
          return redirect("/login?error=An unexpected error occurred. Please contact support.");
        }
      }
    } else if (type === "recovery") {
      // Handle password reset
      const { data: { session }, error: sessionError } = await supabase.client.auth.exchangeCodeForSession(code);

      if (sessionError) {
        console.error("Password reset error:", sessionError);
        return redirect("/login?error=Password reset failed. Please try again.");
      }

      if (session?.user) {
        return redirect("/reset-password?token=" + code);
      }
    } else {
      // Handle other types of auth callbacks
      const { data: { session }, error: sessionError } = await supabase.client.auth.exchangeCodeForSession(code);

      if (sessionError) {
        console.error("Auth callback error:", sessionError);
        return redirect("/login?error=Authentication failed. Please try again.");
      }

      if (session?.user) {
        return redirect("/user");
      }
    }
  } catch (error) {
    console.error("Unexpected error during auth callback:", error);
    return redirect("/login?error=An unexpected error occurred. Please try again later.");
  }

  return redirect("/login");
};

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 3 seconds if something goes wrong
    const timer = setTimeout(() => {
      if (status === 'loading') {
        navigate('/login?error=Verification timed out. Please try again.');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [status, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white text-center">
            {status === 'loading' ? 'Đang xác minh email...' : 
             status === 'success' ? 'Xác minh thành công!' : 
             'Đã xảy ra lỗi'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className={`${
            status === 'loading' ? 'bg-gray-800 border-gray-700' :
            status === 'success' ? 'bg-green-900/50 border-green-800' :
            'bg-red-900/50 border-red-800'
          } text-white`}>
            {status === 'loading' && (
              <AlertDescription className="text-center">
                Vui lòng đợi trong giây lát...
              </AlertDescription>
            )}
            {status === 'success' && (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle2 className="h-5 w-5" />
                <AlertDescription>
                  Email của bạn đã được xác minh thành công!
                </AlertDescription>
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center justify-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription>
                  Đã xảy ra lỗi. Vui lòng thử lại sau.
                </AlertDescription>
              </div>
            )}
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
} 