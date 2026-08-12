"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowUp, Bot, Database, Sparkles } from "lucide-react";

import { cn, initials } from "@/lib/utils";
import { AI_SUGGESTED_PROMPTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  grounded?: boolean;
}

/**
 * CampusOrbit AI chat.
 *
 * Deliberately shows which parts of the student's data each answer drew on.
 * The assistant is grounded in retrieval, so exposing the sources is both a
 * trust signal and a debugging aid during the demo.
 */
export function AssistantChat({ studentName }: { studentName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    startTransition(async () => {
      let content = "CampusOrbit AI is unavailable right now.";
      let sources: string[] | undefined;
      let grounded: boolean | undefined;

      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmed }),
        });

        const payload = (await response.json()) as {
          answer?: string;
          sources?: string[];
          grounded?: boolean;
          error?: string;
        };

        if (response.ok && payload.answer) {
          content = payload.answer;
          sources = payload.sources;
          grounded = payload.grounded;
        } else if (payload.error) {
          content = payload.error;
        }
      } catch {
        content =
          "I could not reach CampusOrbit AI. Check your connection and try again.";
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content, sources, grounded },
      ]);

      inputRef.current?.focus();
    });
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[520px] flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-soft">
      {/* Transcript ------------------------------------------------------- */}
      <div
        className="scrollbar-slim flex-1 overflow-y-auto p-4 sm:p-6"
        role="log"
        aria-live="polite"
        aria-label="Conversation with CampusOrbit AI"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-orbit-gradient text-white shadow-glow">
              <Bot className="size-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-navy-900">
              Ask CampusOrbit AI
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
              I answer only from your real CampusOrbit activity — your verified
              events, completed opportunities, certifications and interests. If
              something isn&apos;t recorded, I&apos;ll say so rather than guess.
            </p>

            <ul className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
              {AI_SUGGESTED_PROMPTS.map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    onClick={() => send(prompt)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-left text-sm text-navy-700 transition-all hover:-translate-y-0.5 hover:border-orbit-200 hover:text-orbit-700 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Sparkles
                      className="mr-1.5 inline size-3.5 text-orbit-500"
                      aria-hidden
                    />
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="space-y-5">
            {messages.map((message) => (
              <li
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.role === "assistant" ? (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orbit-gradient text-white">
                    <Bot className="size-4" aria-hidden />
                  </span>
                ) : null}

                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-navy-800",
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {message.sources && message.sources.length > 0 ? (
                    <div className="mt-3 border-t border-navy-200/60 pt-2.5">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy-500">
                        <Database className="size-3" aria-hidden />
                        Grounded in your data
                      </p>
                      <ul className="mt-1.5 flex flex-wrap gap-1">
                        {message.sources.map((source) => (
                          <li key={source}>
                            <Badge variant="outline" className="text-[11px]">
                              {source}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                {message.role === "user" ? (
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-navy-100 text-xs font-semibold text-navy-700"
                    aria-hidden
                  >
                    {initials(studentName)}
                  </span>
                ) : null}
              </li>
            ))}

            {pending ? (
              <li className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orbit-gradient text-white">
                  <Bot className="size-4" aria-hidden />
                </span>
                <div className="rounded-2xl bg-secondary px-4 py-3">
                  <span className="flex items-center gap-1" aria-label="Thinking">
                    {[0, 1, 2].map((index) => (
                      <span
                        key={index}
                        className="size-1.5 animate-bounce rounded-full bg-navy-400"
                        style={{ animationDelay: `${index * 120}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </li>
            ) : null}
          </ul>
        )}

        <div ref={endRef} />
      </div>

      {/* Composer --------------------------------------------------------- */}
      <form
        className="border-t border-border bg-background/60 p-3 sm:p-4"
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
      >
        <div className="flex items-end gap-2">
          <label htmlFor="assistant-input" className="sr-only">
            Ask CampusOrbit AI a question
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends; Shift+Enter inserts a newline.
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask about your events, opportunities or portfolio…"
            className="scrollbar-slim max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="submit"
            size="icon"
            variant="brand"
            loading={pending}
            disabled={!input.trim()}
            aria-label="Send question"
          >
            <ArrowUp aria-hidden />
          </Button>
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">
          CampusOrbit AI reads only your own records. It cannot see other
          students, and it will not invent activity you have not done.
        </p>
      </form>
    </div>
  );
}
