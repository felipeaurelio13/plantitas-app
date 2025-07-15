

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_user_plants_with_stats"("user_uuid" "uuid") RETURNS TABLE("plant_data" "jsonb", "total_images" integer, "total_messages" integer, "days_since_watered" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(p.*) as plant_data,
    COALESCE(img.image_count, 0)::INTEGER as total_images,
    COALESCE(msg.message_count, 0)::INTEGER as total_messages,
    CASE 
      WHEN p.last_watered IS NULL THEN -1
      ELSE EXTRACT(DAY FROM (NOW() - p.last_watered))::INTEGER
    END as days_since_watered
  FROM public.plants p
  LEFT JOIN (
    SELECT plant_id, COUNT(*) as image_count 
    FROM public.plant_images 
    GROUP BY plant_id
  ) img ON p.id = img.plant_id
  LEFT JOIN (
    SELECT plant_id, COUNT(*) as message_count 
    FROM public.chat_messages 
    GROUP BY plant_id
  ) msg ON p.id = msg.plant_id
  WHERE p.user_id = user_uuid
  ORDER BY p.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_plants_with_stats"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sender" "text" NOT NULL,
    "content" "text" NOT NULL,
    "emotion" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chat_messages_emotion_check" CHECK (("emotion" = ANY (ARRAY['happy'::"text", 'sad'::"text", 'excited'::"text", 'worried'::"text", 'grateful'::"text", 'neutral'::"text"]))),
    CONSTRAINT "chat_messages_sender_check" CHECK (("sender" = ANY (ARRAY['user'::"text", 'plant'::"text"])))
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plant_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "health_analysis" "jsonb" DEFAULT '{}'::"jsonb",
    "is_profile_image" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plant_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plant_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text",
    "scheduled_for" timestamp with time zone NOT NULL,
    "completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "plant_notifications_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "plant_notifications_type_check" CHECK (("type" = ANY (ARRAY['watering'::"text", 'fertilizing'::"text", 'health_check'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."plant_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "species" "text" NOT NULL,
    "variety" "text",
    "nickname" "text",
    "location" "text" NOT NULL,
    "health_score" integer DEFAULT 85,
    "care_profile" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "personality" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "date_added" timestamp with time zone DEFAULT "now"(),
    "last_watered" timestamp with time zone,
    "last_fertilized" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "plants_health_score_check" CHECK ((("health_score" >= 0) AND ("health_score" <= 100)))
);


ALTER TABLE "public"."plants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plant_images"
    ADD CONSTRAINT "plant_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plant_notifications"
    ADD CONSTRAINT "plant_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plants"
    ADD CONSTRAINT "plants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_chat_messages_created_at" ON "public"."chat_messages" USING "btree" ("created_at");



CREATE INDEX "idx_chat_messages_plant_id" ON "public"."chat_messages" USING "btree" ("plant_id");



CREATE INDEX "idx_notifications_scheduled_for" ON "public"."plant_notifications" USING "btree" ("scheduled_for");



CREATE INDEX "idx_notifications_user_id" ON "public"."plant_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_plant_images_plant_id" ON "public"."plant_images" USING "btree" ("plant_id");



CREATE INDEX "idx_plant_images_user_id" ON "public"."plant_images" USING "btree" ("user_id");



CREATE INDEX "idx_plants_health_score" ON "public"."plants" USING "btree" ("health_score");



CREATE INDEX "idx_plants_user_id" ON "public"."plants" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_plants_updated_at" BEFORE UPDATE ON "public"."plants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plant_images"
    ADD CONSTRAINT "plant_images_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plant_images"
    ADD CONSTRAINT "plant_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plant_notifications"
    ADD CONSTRAINT "plant_notifications_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plant_notifications"
    ADD CONSTRAINT "plant_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plants"
    ADD CONSTRAINT "plants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow individual read access" ON "public"."plants" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own notifications" ON "public"."plant_notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own plant images" ON "public"."plant_images" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own plants" ON "public"."plants" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own chat messages" ON "public"."chat_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own notifications" ON "public"."plant_notifications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own plant images" ON "public"."plant_images" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own plants" ON "public"."plants" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own notifications" ON "public"."plant_notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own plants" ON "public"."plants" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own chat messages" ON "public"."chat_messages" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own notifications" ON "public"."plant_notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own plant images" ON "public"."plant_images" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own plants" ON "public"."plants" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plant_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plant_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_user_plants_with_stats"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_plants_with_stats"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_plants_with_stats"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."plant_images" TO "anon";
GRANT ALL ON TABLE "public"."plant_images" TO "authenticated";
GRANT ALL ON TABLE "public"."plant_images" TO "service_role";



GRANT ALL ON TABLE "public"."plant_notifications" TO "anon";
GRANT ALL ON TABLE "public"."plant_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."plant_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."plants" TO "anon";
GRANT ALL ON TABLE "public"."plants" TO "authenticated";
GRANT ALL ON TABLE "public"."plants" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
