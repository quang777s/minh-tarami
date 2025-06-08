import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { getUser, isUserLoggedIn } from "~/lib/supabase/auth.supabase.server";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { Button } from "~/components/ui/button";
import { AdminMenu } from "~/components/admin-menu";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Card, CardContent } from "~/components/ui/card";
import { useToast } from "~/hooks/use-toast";
import { useEffect } from "react";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type Comment = {
  id: number;
  comment_text: string;
  created_at: string;
  post_id: number;
  user_id: string;
  post: {
    title: string;
    slug: string;
  };
  user: {
    name: string;
    email: string;
  };
};

type ActionData = {
  success?: boolean;
  error?: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Check if user is logged in
  if (!(await isUserLoggedIn(request))) {
    throw redirect("/login");
  }

  // Get user data
  const user = await getUser(request);
  if (!user) {
    throw redirect("/login");
  }

  // Get user's profile to check role
  const supabase = createSupabaseServerClient(request);
  const { data: profile, error } = await supabase.client
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !profile) {
    throw redirect("/user");
  }

  // Check if user has admin role
  if (profile.role !== "admin") {
    throw redirect("/user");
  }

  // Fetch all comments with post and user information
  const { data: comments, error: commentsError } = await supabase.client
    .from("tara_comments")
    .select(
      `
      *,
      post:tara_posts (
        title,
        slug
      ),
      user:profiles (
        name,
        email
      )
    `
    )
    .order("created_at", { ascending: false });

  if (commentsError) {
    throw new Error("Failed to fetch comments");
  }

  // Get current locale
  const locale = await getLocale(request);

  return json({
    user,
    profile,
    comments,
    locale,
    t: translations[locale].admin,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const commentId = formData.get("commentId") as string;
  const action = formData.get("action") as string;
  const supabase = createSupabaseServerClient(request);

  if (action === "delete") {
    const { error } = await supabase.client
      .from("tara_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      return json<ActionData>({ error: "Không thể xóa bình luận" });
    }

    return json<ActionData>({ success: true });
  }

  return json<ActionData>({ error: "Hành động không hợp lệ" });
};

export default function AdminComments() {
  const { user, profile, comments, locale, t } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { toast } = useToast();

  useEffect(() => {
    if (actionData?.success) {
      toast({
        title: locale === "vi" ? "Thành công" : "Success",
        description: locale === "vi" ? "Bình luận đã được xóa" : "Comment has been deleted",
        className: "bg-gray-900 text-white border-gray-800",
      });
    } else if (actionData?.error) {
      toast({
        title: locale === "vi" ? "Lỗi" : "Error",
        description: actionData.error,
        variant: "destructive",
        className: "bg-red-900 text-white border-red-800",
      });
    }
  }, [actionData, toast, locale]);

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
      <div className="grid gap-4 md:gap-6 md:grid-cols-[300px_1fr]">
        {/* Admin Menu */}
        <div className="md:block">
          <AdminMenu t={t} />
        </div>

        {/* Main Content */}
        <div className="space-y-4 md:space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {t.menu.comments.title}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                {t.descriptions.comments}
              </p>
            </div>
          </div>

          {/* Comments List */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 sm:p-6">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{locale === "vi" ? "Người bình luận" : "Commenter"}</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>{locale === "vi" ? "Bài viết" : "Post"}</TableHead>
                      <TableHead>{locale === "vi" ? "Nội dung" : "Content"}</TableHead>
                      <TableHead>{locale === "vi" ? "Thời gian" : "Time"}</TableHead>
                      <TableHead>{locale === "vi" ? "Thao tác" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comments.map((comment: Comment) => (
                      <TableRow key={comment.id}>
                        <TableCell>{comment.user.name}</TableCell>
                        <TableCell>{comment.user.email}</TableCell>
                        <TableCell>
                          <a
                            href={`/blog/${comment.post.slug}`}
                            className="text-blue-400 hover:text-blue-300"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {comment.post.title}
                          </a>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {comment.comment_text}
                        </TableCell>
                        <TableCell>
                          {new Date(comment.created_at).toLocaleString(
                            locale === "vi" ? "vi-VN" : "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </TableCell>
                        <TableCell>
                          <Form method="post">
                            <input
                              type="hidden"
                              name="commentId"
                              value={comment.id}
                            />
                            <input type="hidden" name="action" value="delete" />
                            <Button
                              variant="destructive"
                              size="sm"
                              type="submit"
                              onClick={(e) => {
                                if (
                                  !confirm(
                                    locale === "vi" 
                                      ? "Bạn có chắc chắn muốn xóa bình luận này?"
                                      : "Are you sure you want to delete this comment?"
                                  )
                                ) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              {locale === "vi" ? "Xóa" : "Delete"}
                            </Button>
                          </Form>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {comments.map((comment: Comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-1">
                        <div className="font-medium">{comment.user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {comment.user.email}
                        </div>
                        <div className="text-sm">
                          <a
                            href={`/blog/${comment.post.slug}`}
                            className="text-blue-400 hover:text-blue-300"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {comment.post.title}
                          </a>
                        </div>
                        <div className="text-sm mt-2">
                          {comment.comment_text}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString(
                            locale === "vi" ? "vi-VN" : "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                      <Form method="post">
                        <input
                          type="hidden"
                          name="commentId"
                          value={comment.id}
                        />
                        <input type="hidden" name="action" value="delete" />
                        <Button
                          variant="destructive"
                          size="sm"
                          type="submit"
                          className="w-full"
                          onClick={(e) => {
                            if (
                              !confirm(
                                locale === "vi" 
                                  ? "Bạn có chắc chắn muốn xóa bình luận này?"
                                  : "Are you sure you want to delete this comment?"
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          {locale === "vi" ? "Xóa" : "Delete"}
                        </Button>
                      </Form>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {comments.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {locale === "vi" ? "Chưa có bình luận nào" : "No comments yet"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
