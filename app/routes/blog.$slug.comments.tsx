import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import type { Comment } from "~/types/blog";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);

  // Fetch the specific blog post
  const { data: blog } = await supabase.client
    .from("tara_posts")
    .select("id")
    .eq("slug", params.slug)
    .single();

  if (!blog) {
    throw new Error("Blog post not found");
  }

  // Fetch comments for this blog post
  const { data: comments, error: commentsError } = await supabase.client
    .from("tara_comments")
    .select(
      `
      *,
      user:profiles (
        name
      )
    `
    )
    .eq("post_id", blog.id)
    .order("created_at", { ascending: false });

  if (commentsError) {
    console.error("Supabase comments query error:", commentsError);
    throw commentsError;
  }

  return json({ comments });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const supabase = createSupabaseServerClient(request);
  const formData = await request.formData();
  const commentText = formData.get("comment") as string;

  // Check if user is logged in
  const {
    data: { session },
  } = await supabase.client.auth.getSession();
  if (!session) {
    return json(
      { error: "Bạn cần đăng nhập để bình luận" },
      { status: 401 }
    );
  }

  // Check for rate limiting - only allow one comment per minute
  const { data: recentComments } = await supabase.client
    .from("tara_comments")
    .select("created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (recentComments && recentComments.length > 0) {
    const lastCommentTime = new Date(recentComments[0].created_at).getTime();
    const now = new Date().getTime();
    const timeDiff = now - lastCommentTime;

    if (timeDiff < 60000) {
      // 60000ms = 1 minute
      const secondsLeft = Math.ceil((60000 - timeDiff) / 1000);
      return json(
        {
          error: `Vui lòng đợi ${secondsLeft} giây trước khi bình luận tiếp`,
        },
        { status: 429 }
      );
    }
  }

  // Get the blog post ID
  const { data: blog } = await supabase.client
    .from("tara_posts")
    .select("id")
    .eq("slug", params.slug)
    .single();

  if (!blog) {
    return json(
      { error: "Không tìm thấy bài viết" },
      { status: 404 }
    );
  }

  // Insert the comment
  const { error } = await supabase.client.from("tara_comments").insert({
    comment_text: commentText,
    post_id: blog.id,
    user_id: session.user.id,
  });

  if (error) {
    return json(
      { error: "Không thể đăng bình luận. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }

  // Return the updated comments list with user data
  const { data: comments, error: fetchError } = await supabase.client
    .from("tara_comments")
    .select(
      `
      *,
      user:profiles!inner (
        name
      )
    `
    )
    .eq("post_id", blog.id)
    .order("created_at", { ascending: false });

  if (fetchError) {
    return json(
      { error: "Không thể tải bình luận. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }

  return json({ comments });
}; 