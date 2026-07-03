// actions/dashboard/discussion.ts

import { private_api_call } from "../private_api_call";



// import {
//     getPosts,
//     getPost,
//     createPost,
//     updatePost,
//     deletePost,
//     createComment,
//     updateComment,
//     deleteComment,
// } from "@/actions/dashboard/discussion";

export async function createPost(
    classroomId: string,
    postTitle: string,
    postContent: string
) {
    const res = await private_api_call({
        method: "POST",
        path: `classrooms/${classroomId}/discussions`,
        body: {
            title: postTitle,
            content: postContent || null,
        },
    });

    return res;
}

export async function updatePost(classroomId: string, postId: number, postTitle: string, postContent: string, isActive: boolean) {

    const res = await private_api_call({
        method: "PUT",
        path: `classrooms/${classroomId}/discussions/${postId}`,
        body: {
            title: postTitle,
            content: postContent || null,
            is_active: isActive,
        },
    });
    return res;


}

export async function deletePost(classroomId: string, postId: number) {

    const res = await private_api_call({
        method: "DELETE",
        path: `classrooms/${classroomId}/discussions/${postId}`,
    });
    return res;
}

export async function getPost(classroomId: string, postId: number) {

    const res = await private_api_call({
        method: "GET",
        path: `classrooms/${classroomId}/discussions/${postId}`,
    });
    return res;

}

export async function addComment(classroomId: string, postId: number, parentId: number | null, content: string) {

    const res = await private_api_call({
        method: "POST",
        path: `classrooms/${classroomId}/discussions/${postId}/comments`,
        body: {
            content,
            parent_id: parentId,
        },
    });

    return res;
}

export async function updateComment(classroomId: string, postId: number, commentId: number, content: string) {


    const res = await private_api_call({
        method: "PUT",
        path: `classrooms/${classroomId}/discussions/${postId}/comments/${commentId}`,
        body: {
            content,
        },
    });
    return res;
}

export async function getPosts(classroomId: string) {
    const res = await private_api_call({
        method: "GET",
        path: `classrooms/${classroomId}/discussions`,
    });
    return res;

}

export async function deleteComment(classroomId: string, postId: number, commentId: number) {


    const res = await private_api_call({
        method: "DELETE",
        path: `classrooms/${classroomId}/discussions/${postId}/comments/${commentId}`,
    });
    return res;

}

