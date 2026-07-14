"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { FormEvent, useState } from "react";
import { api } from "../../convex/_generated/api";
import { MessageList } from "@/Chat/MessageList";
import { Message } from "@/Chat/Message";
import { Id } from "../../convex/_generated/dataModel";

export function Chat({
  jobId,
  receiverId,
  viewerId,
}: {
  jobId?: Id<"jobs">;
  receiverId?: Id<"users">;
  viewerId?: Id<"users">;
}) {
  const [newMessageText, setNewMessageText] = useState("");
  const messages = useQuery(api.messages.list, jobId ? { jobId } : "skip");
  const sendMessage = useMutation(api.messages.send);

  const canSend = Boolean(jobId && receiverId && viewerId);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!jobId || !receiverId || !newMessageText) return;

    const content = newMessageText;
    setNewMessageText("");
    sendMessage({ jobId, receiverId, content }).catch((error) => {
      console.error("Failed to send message:", error);
    });
  };

  if (!jobId || !receiverId || !viewerId) {
    return (
      <p className="container py-8 text-center text-sm text-muted-foreground">
        Open a job to start messaging.
      </p>
    );
  }

  return (
    <>
      <MessageList messages={messages}>
        {messages?.map((message) => (
          <Message
            key={message._id}
            senderName={message.senderName}
            isOwn={message.senderId === viewerId}
          >
            {message.content}
          </Message>
        ))}
      </MessageList>
      <div className="border-t">
        <form onSubmit={handleSubmit} className="container flex gap-2 py-4">
          <Input
            value={newMessageText}
            onChange={(event) => setNewMessageText(event.target.value)}
            placeholder="Write a message…"
          />
          <Button type="submit" disabled={!canSend || newMessageText === ""}>
            Send
          </Button>
        </form>
      </div>
    </>
  );
}
