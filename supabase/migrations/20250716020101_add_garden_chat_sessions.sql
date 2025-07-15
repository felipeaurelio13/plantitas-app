-- Create garden_chat_sessions table for storing AI conversations about the entire garden
CREATE TABLE IF NOT EXISTS "public"."garden_chat_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "title" "text" DEFAULT 'Chat de Jardín',
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Create garden_chat_messages table for storing individual messages
CREATE TABLE IF NOT EXISTS "public"."garden_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "session_id" "uuid" NOT NULL REFERENCES "public"."garden_chat_sessions"("id") ON DELETE CASCADE,
    "user_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "sender" "text" NOT NULL CHECK ("sender" IN ('user', 'ai')),
    "content" "text" NOT NULL,
    "context" "jsonb" DEFAULT '{}',
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "garden_chat_sessions_user_id_idx" ON "public"."garden_chat_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "garden_chat_sessions_updated_at_idx" ON "public"."garden_chat_sessions"("updated_at" DESC);
CREATE INDEX IF NOT EXISTS "garden_chat_messages_session_id_idx" ON "public"."garden_chat_messages"("session_id");
CREATE INDEX IF NOT EXISTS "garden_chat_messages_created_at_idx" ON "public"."garden_chat_messages"("created_at" DESC);

-- Add RLS policies
ALTER TABLE "public"."garden_chat_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."garden_chat_messages" ENABLE ROW LEVEL SECURITY;

-- Policies for garden_chat_sessions
CREATE POLICY "Users can view their own garden chat sessions" ON "public"."garden_chat_sessions"
    FOR SELECT USING ("user_id" = "auth"."uid"());

CREATE POLICY "Users can create their own garden chat sessions" ON "public"."garden_chat_sessions"
    FOR INSERT WITH CHECK ("user_id" = "auth"."uid"());

CREATE POLICY "Users can update their own garden chat sessions" ON "public"."garden_chat_sessions"
    FOR UPDATE USING ("user_id" = "auth"."uid"());

CREATE POLICY "Users can delete their own garden chat sessions" ON "public"."garden_chat_sessions"
    FOR DELETE USING ("user_id" = "auth"."uid"());

-- Policies for garden_chat_messages
CREATE POLICY "Users can view their own garden chat messages" ON "public"."garden_chat_messages"
    FOR SELECT USING ("user_id" = "auth"."uid"());

CREATE POLICY "Users can create their own garden chat messages" ON "public"."garden_chat_messages"
    FOR INSERT WITH CHECK ("user_id" = "auth"."uid"());

CREATE POLICY "Users can update their own garden chat messages" ON "public"."garden_chat_messages"
    FOR UPDATE USING ("user_id" = "auth"."uid"());

CREATE POLICY "Users can delete their own garden chat messages" ON "public"."garden_chat_messages"
    FOR DELETE USING ("user_id" = "auth"."uid"());

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_garden_chat_session_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "public"."garden_chat_sessions"
    SET "updated_at" = NOW()
    WHERE "id" = NEW."session_id";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session updated_at when a new message is added
CREATE TRIGGER "update_garden_chat_session_on_message"
    AFTER INSERT ON "public"."garden_chat_messages"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_garden_chat_session_updated_at"(); 