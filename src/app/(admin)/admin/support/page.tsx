"use client";

import { useEffect, useState } from "react";
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';
import { Loader2, Mail, CheckCircle, Clock, Send, MessageSquare, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminSupportPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMessage, setActiveMessage] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/admin/support");
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !activeMessage) return;
    
    setReplying(true);
    try {
      const res = await fetch(`/api/admin/support/${activeMessage._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyMessage: replyText }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Reply sent successfully");
        setReplyText("");
        setMessages(messages.map(m => m._id === activeMessage._id ? data.data : m));
        setActiveMessage(data.data);
      } else {
        toast.error(data.error || "Failed to send reply");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 max-w-sm mx-auto">
        <LoadingSpinnerIphone />
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto min-h-[100dvh] font-sans pb-20 ${activeMessage ? '-m-4 p-0 md:m-0 md:p-8' : 'p-0 md:p-8'}`}>
      <div className={`mb-4 md:mb-8 border-b border-border/50 pb-3 md:pb-6 ${activeMessage ? 'hidden lg:block' : 'block'}`}>
        <h1 className="text-xl sm:text-2xl md:text-4xl font-black uppercase tracking-tighter text-foreground leading-none">
          Support Inbox
        </h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-[10px] md:text-sm uppercase tracking-widest md:tracking-[0.2em] font-semibold">
          Manage & reply to customer inquiries
        </p>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-12 md:gap-8 lg:h-[calc(100vh-200px)] lg:min-h-[600px] ${activeMessage ? 'gap-0' : 'gap-4'}`}>
        {/* Sidebar */}
        <div className={`lg:col-span-4 flex-col border border-border rounded-xl bg-background shadow-sm h-[65vh] lg:h-auto overflow-hidden ${activeMessage ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-3 md:p-4 border-b border-border bg-muted/30">
            <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-foreground">All Messages ({messages.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2 scrollbar-hide">
            {messages.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-[10px] uppercase font-bold tracking-widest">Inbox is empty</p>
              </div>
            ) : (
              messages.map(msg => (
                <div 
                  key={msg._id} 
                  onClick={() => setActiveMessage(msg)}
                  className={`p-3 md:p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    activeMessage?._id === msg._id 
                      ? 'border-border bg-muted/50 text-foreground shadow-sm' 
                      : 'border-transparent hover:border-border/50 hover:bg-muted/20 text-foreground'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold truncate pr-2 text-xs md:text-sm">{msg.name}</h3>
                    {msg.status === 'replied' ? (
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
                    )}
                  </div>
                  <p className="text-[10px] md:text-xs truncate text-muted-foreground font-medium mb-1.5">{msg.email}</p>
                  <p className="text-[11px] md:text-xs line-clamp-2 text-muted-foreground/80 leading-relaxed">
                    {msg.replies && msg.replies.length > 0 ? (
                      <>
                        <span className="font-bold text-foreground/70">You: </span>
                        {msg.replies[msg.replies.length - 1].message}
                      </>
                    ) : (
                      msg.message
                    )}
                  </p>
                  <div className="mt-2 md:mt-3 text-[8px] md:text-[9px] uppercase tracking-widest text-muted-foreground/60 font-bold">
                    {new Date(msg.replies && msg.replies.length > 0 ? msg.replies[msg.replies.length - 1].createdAt : msg.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={`lg:col-span-8 flex-col border-0 lg:border border-border rounded-none lg:rounded-xl bg-background shadow-none lg:shadow-sm relative overflow-hidden h-[calc(100dvh-65px)] lg:h-auto ${!activeMessage ? 'hidden lg:flex' : 'flex'}`}>
          {activeMessage ? (
            <>
              {/* Header */}
              <div className="p-3 md:p-6 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 md:gap-4">
                <div className="flex items-start gap-3">
                  <button onClick={() => setActiveMessage(null)} className="lg:hidden mt-0.5 p-1.5 border border-border rounded-lg bg-background hover:bg-muted text-foreground">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-lg md:text-2xl font-bold tracking-tight text-foreground leading-tight truncate">{activeMessage.name}</h2>
                    <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1 text-muted-foreground">
                      <Mail className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                      <span className="text-[10px] md:text-xs font-semibold tracking-wide truncate">{activeMessage.email}</span>
                    </div>
                  </div>
                </div>
                <div className="px-2 py-0.5 md:px-3 md:py-1 border border-border bg-muted text-foreground text-[9px] md:text-[10px] font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2 rounded-full shadow-sm self-start sm:self-auto ml-[46px] sm:ml-0 shrink-0">
                  {activeMessage.status === 'replied' ? 'Replied' : 'Pending'}
                </div>
              </div>

              {/* Thread */}
              <div className="flex-1 overflow-y-auto p-3 md:p-8 space-y-4 md:space-y-6 scrollbar-hide bg-muted/10">
                {/* Original Message */}
                <div className="flex flex-col gap-1 md:gap-1.5">
                  <div className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-2">
                    Customer &bull; {new Date(activeMessage.createdAt).toLocaleString()}
                  </div>
                  <div className="bg-background border border-border shadow-sm p-3 md:p-6 max-w-[95%] md:max-w-[80%] self-start rounded-2xl rounded-bl-sm">
                    <p className="text-foreground text-[11px] md:text-sm leading-relaxed whitespace-pre-wrap font-medium break-words">
                      {activeMessage.message}
                    </p>
                  </div>
                </div>

                {/* Replies */}
                {activeMessage.replies?.map((reply: any, index: number) => (
                  <div key={index} className="flex flex-col gap-1 md:gap-1.5 items-end">
                    <div className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80 mr-2">
                      Support Team &bull; {new Date(reply.createdAt).toLocaleString()}
                    </div>
                    <div className="bg-foreground/90 dark:bg-foreground/80 border border-transparent shadow-sm p-3 md:p-6 max-w-[95%] md:max-w-[80%] self-end text-background rounded-2xl rounded-br-sm">
                      <p className="text-[11px] md:text-sm leading-relaxed whitespace-pre-wrap font-medium break-words">
                        {reply.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="p-3 md:p-6 border-t border-border bg-background">
                <div className="flex flex-col gap-2 md:gap-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply here..."
                    className="w-full min-h-[80px] md:min-h-[120px] p-3 md:p-4 bg-muted/20 border border-border rounded-xl focus:border-foreground focus:ring-1 focus:ring-foreground outline-none text-[11px] md:text-sm font-medium text-foreground placeholder:text-muted-foreground resize-none transition-all"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleReply}
                      disabled={replying || !replyText.trim()}
                      className="group relative inline-flex items-center justify-center px-4 py-2 md:px-6 md:py-2.5 text-[9px] md:text-[11px] font-bold tracking-widest text-background uppercase bg-foreground/90 overflow-hidden border border-transparent rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:bg-foreground shrink-0"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {replying ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Send Reply
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center">
              <MessageSquare className="w-12 h-12 md:w-16 md:h-16 mb-4 md:mb-6 opacity-20 text-foreground" />
              <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-foreground mb-2">No Message Selected</h3>
              <p className="text-[10px] md:text-xs uppercase font-bold tracking-widest text-muted-foreground">
                Select a message from the sidebar to view details and reply
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
