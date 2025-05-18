import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getUser, isUserLoggedIn } from "~/lib/supabase/auth.supabase.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Check if user is logged in
  if (!(await isUserLoggedIn(request))) {
    throw redirect("/login");
  }

  // Get user data
  const user = await getUser(request);
  
  return json({ user });
};

export default function UserProfile() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold underline pb-5">My Profile</h1>
        <p>View and manage your profile information.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        
        <div className="space-y-3">
          <div>
            <span className="font-medium">Email: </span>
            <span>{user?.email}</span>
          </div>
          
          <div>
            <span className="font-medium">User ID: </span>
            <span>{user?.id}</span>
          </div>
          
          {user?.user_metadata && (
            <div>
              <span className="font-medium">Name: </span>
              <span>
                {user.user_metadata.full_name || 'Not provided'}
              </span>
            </div>
          )}
          
          <div>
            <span className="font-medium">Email Verified: </span>
            <span>{user?.email_confirmed_at ? 'Yes' : 'No'}</span>
          </div>
          
          <div>
            <span className="font-medium">Last Sign In: </span>
            <span>
              {user?.last_sign_in_at 
                ? new Date(user.last_sign_in_at).toLocaleString() 
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <Link className="bg-sky-500 text-white rounded p-2" to="/user">
          Dashboard
        </Link>
        <Link className="bg-sky-500 text-white rounded p-2" to="/user/account">
          Account Settings
        </Link>
      </div>
    </div>
  );
}
