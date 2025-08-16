import {
  Form,
  Link,
  useActionData,
  useNavigation,
  useFetcher,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import type { Comment } from "~/types/blog";

type BlogCommentsProps = {
  slug: string;
  isLoggedIn: boolean;
  locale: string;
};

type FetcherData = {
  comments?: Comment[];
  error?: string;
};

export default function BlogComments({
  slug,
  isLoggedIn,
  locale,
}: BlogCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const fetcher = useFetcher<FetcherData>();
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Load comments on mount
  useEffect(() => {
    fetcher.load(`/blog/${slug}/comments`);
  }, [slug]);

  // Update comments when fetcher data changes
  useEffect(() => {
    if (fetcher.data?.comments) {
      setComments(fetcher.data.comments);
    }
  }, [fetcher.data]);

  return (
    <section className="relative w-full bg-black py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-violet-100 mb-8">Bình luận</h2>

        {/* Comment Form */}
        {isLoggedIn ? (
          <Form
            method="post"
            action={`/blog/${slug}/comments`}
            className="mb-8"
          >
            <div className="mb-4">
              <textarea
                name="comment"
                rows={4}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-violet-100 placeholder-gray-400 focus:outline-none focus:border-gray-500"
                placeholder="Viết bình luận của bạn..."
                required
              />
            </div>
            {actionData?.error && (
              <p className="text-red-500 mb-4">{actionData.error}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors duration-300 disabled:opacity-50"
            >
              {isSubmitting ? "Đang đăng..." : "Đăng bình luận"}
            </button>
          </Form>
        ) : (
          <div className="mb-8 p-4 bg-black/50 rounded-lg">
            <p className="text-violet-100">
              Vui lòng{" "}
              <Link to="/login" className="text-blue-400 hover:text-blue-300">
                đăng nhập
              </Link>{" "}
              để bình luận.
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-black/50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-violet-100">
                  {comment.user?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="ml-4">
                  <p className="text-violet-100 font-medium">
                    {comment.user?.name || "Người dùng ẩn danh"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {new Date(comment.created_at).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <p className="text-violet-100">{comment.comment_text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
