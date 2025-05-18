import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { isUserLoggedIn } from "~/lib/supabase/auth.supabase.server";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { createServiceRoleClient } from "~/lib/supabase/supabase.service.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (await isUserLoggedIn(request)) {
    throw redirect("/user");
  }

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validate passwords match
  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  // Validate password strength
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long" };
  }

  const { data: authData, error: signUpError } =
    await supabase.client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    });

  if (signUpError) {
    return { error: signUpError.message };
  }

  console.log(authData);

  if (authData.user) {
    try {
      // Create profile record using service role client
      const serviceClient = createServiceRoleClient();
      console.log("Creating profile for user:", authData.user.id);

      const { data: profileData, error: profileError } = await serviceClient
        .from("profiles")
        .insert([
          {
            user_id: authData.user.id,
            email: email,
            role: "customer",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (profileError) {
        console.error("Profile creation error:", {
          error: profileError,
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
        });

        // Try to delete the auth user since profile creation failed
        await supabase.client.auth.admin.deleteUser(authData.user.id);
        return {
          error: `Failed to create user profile: ${profileError.message}`,
        };
      }

      console.log("Profile created successfully:", profileData);
    } catch (error) {
      console.error("Unexpected error during profile creation:", error);
      return { error: "An unexpected error occurred during profile creation" };
    }
  }

  // Redirect to login page with success message
  throw redirect(
    "/login?message=Registration successful. Please check your email to verify your account."
  );
};

export default function Register() {
  const actionResponse = useActionData<typeof action>();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold underline pb-5">Register</h1>
        <p>Create a new account to get started.</p>
      </div>

      <Form method="post" className="flex flex-col gap-4">
        {actionResponse?.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {actionResponse.error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            required
            className="border rounded p-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="font-medium">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            required
            className="border rounded p-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmPassword" className="font-medium">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm your password"
            required
            className="border rounded p-2"
          />
        </div>

        <button
          type="submit"
          className="bg-sky-500 text-white rounded p-2 hover:bg-sky-600 transition-colors"
        >
          Register
        </button>
      </Form>

      <div className="text-center">
        <p>
          Already have an account?{" "}
          <a href="/login" className="text-sky-500 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
