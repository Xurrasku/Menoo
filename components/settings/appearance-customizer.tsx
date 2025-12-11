"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { sendChatMessage, streamChatMessage } from "@/lib/api/menoo-backend";
import type { MenuListRow } from "@/lib/menus/service";
import { Send, Loader2 } from "lucide-react";

type AppearanceCustomizerProps = {
  locale: string;
  menus: MenuListRow[];
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export function AppearanceCustomizer({ locale, menus }: AppearanceCustomizerProps) {
  const t = useTranslations("settings.appearance");
  const [selectedMenuId, setSelectedMenuId] = useState<string | undefined>(
    menus.length > 0 ? menus[0].id : undefined
  );
  const [restaurantWebsite, setRestaurantWebsite] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !selectedMenuId) return;

    // Build the message with website if provided
    let messageToSend = inputValue.trim();
    if (restaurantWebsite.trim()) {
      const websiteUrl = restaurantWebsite.trim();
      messageToSend = `${messageToSend}\n\nRestaurant website: ${websiteUrl}`;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue.trim(), // Display original message without website in UI
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setStreamingContent("");

    let accumulatedContent = "";

    try {
      // Use streaming for better UX
      const newThreadId = await streamChatMessage(
        messageToSend, // Send full message with website to agent
        selectedMenuId,
        threadId,
        (chunk) => {
          accumulatedContent += chunk;
          setStreamingContent(accumulatedContent);
        }
      );

      // Add assistant message after streaming completes
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: accumulatedContent,
          timestamp: new Date(),
        },
      ]);

      setStreamingContent("");
      setThreadId(newThreadId || threadId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Error: ${errorMessage}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  };

  const handleSendWebsite = async () => {
    if (!restaurantWebsite.trim() || isLoading || !selectedMenuId) {
      if (!restaurantWebsite.trim()) {
        window.alert(t("websiteRequired") || "Please enter a website URL");
      }
      return;
    }

    const messageToSend = `Update the menu design based on the restaurant website: ${restaurantWebsite.trim()}`;

    setIsLoading(true);
    setStreamingContent("");

    let accumulatedContent = "";

    try {
      // Use streaming for better UX
      const newThreadId = await streamChatMessage(
        messageToSend,
        selectedMenuId,
        threadId,
        (chunk) => {
          accumulatedContent += chunk;
          setStreamingContent(accumulatedContent);
        }
      );

      setStreamingContent("");
      setThreadId(newThreadId || threadId);
      
      // Show success message
      window.alert(t("designUpdateSuccess") || "Design update request sent successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      // eslint-disable-next-line no-console
      console.error("Error sending website for design update:", error);
      const errorText = `${t("designUpdateError")}: ${errorMessage}`;
      window.alert(errorText);
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  };


  if (menus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-[5%] sm:p-10 text-center">
        <p className="text-[3vw] text-slate-500 sm:text-base">
          {t("noMenus")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[3%] sm:gap-6 h-full">
      {/* Menu Selector */}
      {menus.length > 1 && (
        <div className="flex flex-col gap-[2%] sm:gap-2">
          <label className="text-[2.5vw] font-medium text-slate-700 sm:text-sm">
            {t("selectMenu")}
          </label>
          <select
            value={selectedMenuId || ""}
            onChange={(e) => setSelectedMenuId(e.target.value || undefined)}
            className="rounded-lg border border-slate-200 bg-white px-[3%] py-[2%] text-[2.5vw] focus:outline-none focus:ring-2 focus:ring-primary/40 sm:px-4 sm:py-2 sm:text-sm"
          >
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Restaurant Website Input */}
      <div className="flex flex-col gap-[2%] sm:gap-2">
        <label className="text-[2.5vw] font-medium text-slate-700 sm:text-sm">
          {t("restaurantWebsite")}
        </label>
        <div className="flex gap-[2%] sm:gap-2">
          <Input
            type="url"
            value={restaurantWebsite}
            onChange={(e) => setRestaurantWebsite(e.target.value)}
            placeholder={t("websitePlaceholder")}
            className="flex-1 text-[2.5vw] sm:text-sm"
            disabled={isLoading || !selectedMenuId}
          />
          <Button
            type="button"
            onClick={handleSendWebsite}
            disabled={!restaurantWebsite.trim() || isLoading || !selectedMenuId}
            className="flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-[3vw] w-[3vw] animate-spin sm:h-4 sm:w-4" />
            ) : (
              <Send className="h-[3vw] w-[3vw] sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
        {restaurantWebsite && (
          <p className="text-[2vw] text-slate-500 sm:text-xs">
            {t("websiteNote")}
          </p>
        )}
      </div>

    </div>
  );
}

