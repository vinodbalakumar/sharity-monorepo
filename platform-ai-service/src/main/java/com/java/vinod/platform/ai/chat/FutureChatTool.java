package com.java.vinod.platform.ai.chat;

/** Future read-only tools must authorize the verified identity before fetching data.
 * No implementations or Spring AI tool callbacks are registered in this release. */
public interface FutureChatTool {
    String name();
    boolean authorized(ChatIdentity identity);
}
