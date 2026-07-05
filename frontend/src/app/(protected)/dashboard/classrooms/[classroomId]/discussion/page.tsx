"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Plus,
    MessageSquare,
    MessageCircle,
    MoreVertical,
    Pencil,
    Trash2,
    X,
    Reply,
    Send,
    Archive,
    ArchiveRestore,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { private_api_call } from "@/actions/private_api_call";
import ClassroomTabs from "@/components/classroom/ClassroomTabs";
import {
    getPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    addComment,
    updateComment,
    deleteComment,
} from "@/actions/dashboard/discussion";
import { Dialog } from "@/components/ui/dialog";
import { useClassroom } from "../ClassroomContext";

/* =========================================================================
   TYPES — mirror your service layer + Pydantic models EXACTLY
   =========================================================================
   Source of truth:
     - CreatePostInput / UpdatePostInput / CreateCommentInput / UpdateCommentInput
     - create_post / update_post / get_posts / get_post / create_comment /
       update_comment / delete_comment (service)
     - endpoint list screenshot (/api/v1/classrooms/{classroom_id}/discussions/...)

   Every response you return follows: { success, message, data }
   ========================================================================= */

interface DiscussionUser {
    id: number;
    full_name: string;
    email: string;
}

// Matches the flat row shape _get_comment_tree() builds, then nests via
// `replies` (built client-side from parent_id in your backend, already
// nested by the time it reaches the frontend)
interface Comment {
    id: number;
    post_id: number;
    parent_id: number | null;
    content: string;
    created_at: string;
    updated_at: string;
    created_by: DiscussionUser;
    replies: Comment[];
}

// Matches create_post / update_post / get_posts / get_post RETURNING + comments
interface Post {
    id: number;
    classroom_id: number;
    title: string;
    content: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: DiscussionUser;
    comments: Comment[];
}

// ⚠️ ASSUMED: there's no /me or auth-context endpoint in what you've shared.
// This mock stands in for the logged-in user until you wire real auth —
// swap CURRENT_USER for your session/user context.
// const CURRENT_USER: DiscussionUser = {
//     id: 1,
//     full_name: "Ms. Rivera",
//     email: "rivera@school.edu",
// };
// const IS_OWNER = true; // ASSUMED — controls teacher-only actions (create/edit/delete post, delete any comment)



// Matches CreatePostInput exactly
interface PostFormState {
    title: string;
    content: string;
}

// Matches UpdatePostInput exactly
interface EditPostFormState {
    title: string;
    content: string;
    is_active: boolean;
}

const emptyPostForm: PostFormState = { title: "", content: "" };



/* =========================================================================
   HELPERS
   ========================================================================= */

function formatTimestamp(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function countComments(comments: Comment[]): number {
    return comments.reduce((sum, c) => sum + 1 + countComments(c.replies), 0);
}

function initials(name?: string | null): string {
    if (!name) return "?";

    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

// Recursively insert a reply under `parentId` (null = top-level comment)
function insertComment(comments: Comment[], parentId: number | null, newComment: Comment): Comment[] {
    if (parentId === null) return [...comments, newComment];
    return comments.map((c) =>
        c.id === parentId
            ? { ...c, replies: [...c.replies, newComment] }
            : { ...c, replies: insertComment(c.replies, parentId, newComment) }
    );
}

// Recursively update a comment's content
function updateCommentTree(comments: Comment[], commentId: number, content: string): Comment[] {
    return comments.map((c) =>
        c.id === commentId
            ? { ...c, content, updated_at: new Date().toISOString() }
            : { ...c, replies: updateCommentTree(c.replies, commentId, content) }
    );
}

// Recursively remove a comment (and its replies) by id
function removeCommentTree(comments: Comment[], commentId: number): Comment[] {
    return comments
        .filter((c) => c.id !== commentId)
        .map((c) => ({ ...c, replies: removeCommentTree(c.replies, commentId) }));
}

/* =========================================================================
   PAGE
   ========================================================================= */

export default function DiscussionsPage() {
    const params = useParams();
    const classroomId = params?.classroomId as string;

    const classroom = useClassroom();

    const isTeacher = classroom.current_user.role === "teacher";

    const [posts, setPosts] = useState<Post[]>([]);
    const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState<PostFormState>(emptyPostForm);
    const [isSubmittingPost, setIsSubmittingPost] = useState(false);

    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [editForm, setEditForm] = useState<EditPostFormState>({ title: "", content: "", is_active: true });

    /* ------------------------------ post handlers ------------------------------ */

    function handleOpenCreateModal() {
        setCreateForm(emptyPostForm);
        setIsCreateModalOpen(true);
    }

    async function handleCreatePost(postTitle: string, postContent: string) {
        setIsSubmittingPost(true);
        const res = await createPost(classroomId, postTitle, postContent);
        const json = res;

        if (!json?.success || !json?.data) {
            console.error("Failed to create post:", json?.message);
            setIsSubmittingPost(false);
            return; // don't touch posts state, don't close modal
        }

        setPosts((prev) => [json.data, ...prev]);
        setIsSubmittingPost(false);
        setIsCreateModalOpen(false);
    }

    function handleOpenEditModal(post: Post) {
        setEditingPost(post);
        setEditForm({ title: post.title, content: post.content ?? "", is_active: post.is_active });
        setOpenMenuId(null);
    }

    async function handleUpdatePost(postTitle: string, postContent: string, isActive: boolean) {
        if (!editingPost) return;

        const res = await updatePost(
            classroomId,
            editingPost.id,
            postTitle,
            postContent,
            isActive
        );
        const json = res;
        setPosts((prev) =>
            prev.map((p) =>
                p.id === editingPost.id ? json.data : p
            )
        );
        setEditingPost(null);
    }

    async function handleDeletePost(post: Post) {

        const res = await deletePost(classroomId, post.id);
        const json = res;
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
        setOpenMenuId(null);
        if (expandedPostId === post.id) setExpandedPostId(null);
    }

    async function handleToggleExpand(postId: number) {

        const res = await getPost(classroomId, postId);
        const json = res;
        setExpandedPostId((prev) => (prev === postId ? null : postId));
    }

    /* ---------------------------- comment handlers ---------------------------- */

    async function handleAddComment(postId: number, parentId: number | null, content: string) {

        const res = await addComment(classroomId, postId, parentId, content)
        const json = res;
        const localComment: Comment = {
            id: Date.now(),
            post_id: postId,
            parent_id: parentId,
            content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: {
                id: Number(classroom.current_user.id),
                full_name: classroom.current_user.full_name,
                email: classroom.current_user.email,
            },
            replies: [],
        };


        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId ? { ...p, comments: insertComment(p.comments, parentId, localComment) } : p
            )
        );
    }

    async function handleUpdateComment(postId: number, commentId: number, content: string) {

        const res = await updateComment(classroomId, postId, commentId, content);
        const json = res;


        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId ? { ...p, comments: updateCommentTree(p.comments, commentId, content) } : p
            )
        );
    }

    async function handleDeleteComment(postId: number, commentId: number) {

        const res = await deleteComment(classroomId, postId, commentId);
        const json = res;
        setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, comments: removeCommentTree(p.comments, commentId) } : p))
        );
    }

    // ---------------------------------------------------------------------
    // TODO: GET /api/v1/classrooms/{classroom_id}/discussions  (initial load)
    //
    useEffect(() => {
        async function loadPosts() {
            const response = await getPosts(classroomId);
            setPosts(Array.isArray(response?.data) ? response.data.filter(Boolean) : []);
        }
        loadPosts();
    }, [classroomId]);
    // console.log("posts:", posts);
    // console.log("isTeacher:", isTeacher);

    const visiblePosts = isTeacher ? posts : posts.filter((p) => p.is_active);

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
                        <MessageSquare className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-text-main">Discussions</h1>
                        <p className="text-sm text-text-main">
                            {visiblePosts.length} {visiblePosts.length === 1 ? "post" : "posts"}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-text-main transition-colors hover:opacity-90 active:opacity-80"
                >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    New post
                </button>
            </div>

            {/* Post list */}
            {visiblePosts.length === 0 ? (
                <EmptyState onCreate={handleOpenCreateModal} />

            ) : (
                <div className="flex flex-col gap-3">
                    {visiblePosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            isExpanded={expandedPostId === post.id}
                            isMenuOpen={openMenuId === post.id}
                            onToggleExpand={() => handleToggleExpand(post.id)}
                            onToggleMenu={() => setOpenMenuId((prev) => (prev === post.id ? null : post.id))}
                            onEdit={() => handleOpenEditModal(post)}
                            onDelete={() => handleDeletePost(post)}
                            onAddComment={(parentId, content) => handleAddComment(post.id, parentId, content)}
                            onUpdateComment={(commentId, content) => handleUpdateComment(post.id, commentId, content)}
                            onDeleteComment={(commentId) => handleDeleteComment(post.id, commentId)}
                        />
                    ))}
                </div>
            )}

            {/* Create post modal */}
            {isCreateModalOpen && (
                <PostFormModal
                    title="New post"
                    submitLabel="Post"
                    isSubmitting={isSubmittingPost}
                    initialTitle={createForm.title}
                    initialContent={createForm.content}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSubmit={(postTitle, postContent) => handleCreatePost(postTitle, postContent)}
                />
            )}

            {/* Edit post modal */}
            {editingPost && (
                <PostFormModal
                    title="Edit post"
                    submitLabel="Save changes"
                    isSubmitting={false}
                    initialTitle={editForm.title}
                    initialContent={editForm.content}
                    initialIsActive={editForm.is_active}
                    showActiveToggle
                    onClose={() => setEditingPost(null)}
                    onSubmit={(postTitle, postContent, isActive) =>
                        handleUpdatePost(postTitle, postContent, isActive ?? true)
                    }
                />
            )}
        </div>
    );
}

/* =========================================================================
   POST CARD
   ========================================================================= */


function PostCard({
    post,
    isExpanded,
    isMenuOpen,
    onToggleExpand,
    onToggleMenu,
    onEdit,
    onDelete,
    onAddComment,
    onUpdateComment,
    onDeleteComment,
}: {
    post: Post;
    isExpanded: boolean;
    isMenuOpen: boolean;
    onToggleExpand: () => void;
    onToggleMenu: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAddComment: (parentId: number | null, content: string) => void;
    onUpdateComment: (commentId: number, content: string) => void;
    onDeleteComment: (commentId: number) => void;
}) {
    const [replyText, setReplyText] = useState("");
    const totalComments = countComments(post.comments);

    const classroom = useClassroom();
    const isTeacher = classroom.current_user.role === "teacher";

    const isOwnPost = post.created_by.id === Number(classroom.current_user.id);
    const canEditPost = isOwnPost;
    const canDeletePost = isTeacher || isOwnPost;
    const canShowMenu = canEditPost || canDeletePost;

    function submitTopLevelComment() {
        const trimmed = replyText.trim();
        if (!trimmed) return;
        onAddComment(null, trimmed);
        setReplyText("");
    }

    return (
        <div className="rounded-xl border border-surface-border bg-surface-main transition-colors hover:border-surface-border">
            {/* Post header */}
            <div className="flex items-start gap-3 p-4 sm:p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-secondary/15 text-xs font-semibold text-brand-secondary">
                    {initials(post.created_by?.full_name || "User")}

                </div>

                <div className="min-w-0 flex-1 cursor-pointer" onClick={onToggleExpand}>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="text-sm font-medium text-text-main sm:text-base">{post.title}</h3>
                        {!post.is_active && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-surface-border px-2 py-0.5 text-xs font-medium text-text-main">
                                <Archive className="h-3 w-3" />
                                Archived
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 text-xs text-text-main">
                        {post.created_by.full_name} · {formatTimestamp(post.created_at)}
                    </p>
                    {post.content && !isExpanded && (
                        <p className="mt-2 line-clamp-2 text-sm text-text-main">{post.content}</p>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <button
                        onClick={onToggleExpand}
                        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-text-main hover:bg-surface-border hover:text-text-main"
                    >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {totalComments}
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>


                    {canShowMenu && (
                        <div className="relative">

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleMenu();
                                }}
                                className="rounded-lg p-1.5 text-text-main hover:bg-surface-border hover:text-text-main"
                                aria-label="Post actions"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </button>

                            {isMenuOpen && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-lg border border-surface-border bg-surface-main shadow-xl shadow-black/40"
                                >

                                    {canEditPost && (

                                        <button
                                            onClick={onEdit}
                                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-text-main hover:bg-surface-border hover:text-text-main"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit
                                        </button>
                                    )}
                                    {canDeletePost && (
                                        <button
                                            onClick={onDelete}
                                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-surface-border hover:text-text-main"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}



                    {/* {canManage && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleMenu();
                                }}
                                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                                aria-label="Post actions"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </button>

                            {isMenuOpen && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/40"
                                >
                                    <button
                                        onClick={onEdit}
                                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={onDelete}
                                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-zinc-800"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )} */}


                </div>
            </div>

            {/* Expanded: full content + comment thread */}
            {isExpanded && (
                <div className="border-t border-surface-border px-4 pb-4 pt-3 sm:px-5">
                    {post.content && <p className="mb-4 whitespace-pre-wrap text-sm text-text-main">{post.content}</p>}

                    {/* Comment thread */}
                    <div className="flex flex-col gap-3">
                        {post.comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                depth={0}
                                onReply={(parentId, content) => onAddComment(parentId, content)}
                                onUpdate={onUpdateComment}
                                onDelete={onDeleteComment}
                            />
                        ))}
                    </div>

                    {/* New top-level comment */}
                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-[10px] font-semibold text-text-main">
                            {initials(classroom.current_user.id)}
                        </div>
                        <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && submitTopLevelComment()}
                            placeholder="Add a comment..."
                            className="w-full rounded-lg border border-surface-border bg-surface-main px-3 py-2 text-sm text-text-main placeholder:text-text-main focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                        <button
                            onClick={submitTopLevelComment}
                            disabled={!replyText.trim()}
                            className="shrink-0 rounded-lg p-2 text-brand-primary hover:bg-surface-border hover:text-text-main disabled:text-text-main-disabled disabled:hover:bg-transparent"
                            aria-label="Send comment"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


/* =========================================================================
   COMMENT ITEM — recursive, supports infinite nesting like your backend
   ========================================================================= */

function CommentItem({
    comment,
    depth,
    onReply,
    onUpdate,
    onDelete,
}: {
    comment: Comment;
    depth: number;
    onReply: (parentId: number, content: string) => void;
    onUpdate: (commentId: number, content: string) => void;
    onDelete: (commentId: number) => void;
}) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);

    const classroom = useClassroom();
    const isTeacher = classroom.current_user.role === "teacher";

    const isOwnComment = comment.created_by.id === Number(classroom.current_user.id);
    const canDelete = isTeacher || isOwnComment;

    function submitReply() {
        const trimmed = replyText.trim();
        if (!trimmed) return;
        onReply(comment.id, trimmed);
        setReplyText("");
        setIsReplying(false);
    }

    function submitEdit() {
        const trimmed = editText.trim();
        if (!trimmed) return;
        onUpdate(comment.id, trimmed);
        setIsEditing(false);
    }

    return (
        <div className={depth > 0 ? "ml-6 border-l border-zinc-800 pl-4 sm:ml-8" : ""}>
            <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-300">
                    {initials(comment.created_by.full_name)}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-200">{comment.created_by.full_name}</span>
                            <span className="text-xs text-zinc-500">{formatTimestamp(comment.created_at)}</span>
                        </div>

                        {isEditing ? (
                            <div className="mt-1.5 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && submitEdit()}
                                    autoFocus
                                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 focus:border-brand-primary focus:outline-none"
                                />
                                <button onClick={submitEdit} className="shrink-0 text-xs font-medium text-brand-primary">
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditText(comment.content);
                                    }}
                                    className="shrink-0 text-xs text-zinc-500 hover:text-zinc-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-300">{comment.content}</p>
                        )}
                    </div>

                    {!isEditing && (
                        <div className="mt-1 flex items-center gap-3 px-1 text-xs text-zinc-500">
                            <button
                                onClick={() => setIsReplying((prev) => !prev)}
                                className="flex items-center gap-1 hover:text-zinc-300"
                            >
                                <Reply className="h-3 w-3" />
                                Reply
                            </button>
                            {isOwnComment && (
                                <button onClick={() => setIsEditing(true)} className="hover:text-zinc-300">
                                    Edit
                                </button>
                            )}
                            {canDelete && (
                                <button onClick={() => onDelete(comment.id)} className="hover:text-red-400">
                                    Delete
                                </button>
                            )}
                        </div>
                    )}

                    {isReplying && (
                        <div className="mt-2 flex items-center gap-2">
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && submitReply()}
                                autoFocus
                                placeholder={`Reply to ${comment.created_by.full_name}...`}
                                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-primary focus:outline-none"
                            />
                            <button
                                onClick={submitReply}
                                disabled={!replyText.trim()}
                                className="shrink-0 text-xs font-medium text-brand-primary disabled:text-zinc-600"
                            >
                                Reply
                            </button>
                        </div>
                    )}

                    {/* Nested replies */}
                    {comment.replies.length > 0 && (
                        <div className="mt-3 flex flex-col gap-3">
                            {comment.replies.map((reply) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    depth={depth + 1}
                                    onReply={onReply}
                                    onUpdate={onUpdate}
                                    onDelete={onDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* =========================================================================
   EMPTY STATE
   ========================================================================= */

function EmptyState({ onCreate }: { onCreate?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
                <MessageSquare className="h-6 w-6 text-zinc-600" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-zinc-200">No discussions yet</h3>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
                {onCreate ? "Start the conversation with your class." : "Check back later for new posts."}
            </p>
            {onCreate && (
                <button
                    onClick={onCreate}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:opacity-90"
                >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    New post
                </button>
            )}
        </div>
    );
}

/* =========================================================================
   POST FORM MODAL — shared by create (CreatePostInput) and edit (UpdatePostInput)
   ========================================================================= */

function PostFormModal({
    title,
    submitLabel,
    isSubmitting,
    initialTitle,
    initialContent,
    initialIsActive = true,
    showActiveToggle = false,
    onClose,
    onSubmit,
}: {
    title: string;
    submitLabel: string;
    isSubmitting: boolean;
    initialTitle: string;
    initialContent: string;
    initialIsActive?: boolean;
    showActiveToggle?: boolean;
    onClose: () => void;
    onSubmit: (title: string, content: string, is_active?: boolean) => void;
}) {
    const [postTitle, setPostTitle] = useState(initialTitle);
    const [postContent, setPostContent] = useState(initialContent);
    const [isActive, setIsActive] = useState(initialIsActive);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit(postTitle, postContent, isActive);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[90vh] w-full flex-col rounded-t-2xl border border-zinc-800 bg-zinc-900 sm:max-w-lg sm:rounded-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                    <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                required
                                type="text"
                                value={postTitle}
                                onChange={(e) => setPostTitle(e.target.value)}
                                placeholder="What's this about?"
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Content</label>
                            <textarea
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                                placeholder="Share details, ask a question, or start a discussion..."
                                rows={5}
                                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            />
                        </div>

                        {showActiveToggle && (
                            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                                <label className="flex cursor-pointer items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm text-zinc-300">
                                        {isActive ? <ArchiveRestore className="h-4 w-4 text-zinc-500" /> : <Archive className="h-4 w-4 text-zinc-500" />}
                                        {isActive ? "Visible to students" : "Archived (hidden from students)"}
                                    </span>
                                    <ToggleSwitch checked={isActive} onChange={setIsActive} />
                                </label>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={!postTitle.trim() || isSubmitting}
                        className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500 disabled:opacity-100"
                    >
                        {isSubmitting ? "Posting..." : submitLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* =========================================================================
   TOGGLE SWITCH
   ========================================================================= */

function ToggleSwitch({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand-primary" : "bg-zinc-700"
                }`}
        >
            <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
            />
        </button>
    );
}